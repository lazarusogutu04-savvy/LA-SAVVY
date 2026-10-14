-- ════════════════════════════════════════════════════════════════════════════
-- LA & SAVVY Mtaani Errands — Supabase schema (run once in Supabase → SQL Editor)
-- Tables: agents, orders, payment_config, pricing_config, competitor_benchmarks,
--         quote_requests • Storage bucket: mtaani-files (public) • RLS on everything
-- Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════
--
-- ⚠️ If you previously ran supabase/migrations/0001_init.sql (old v1 schema), its
--    `orders` / `agents` tables have different columns. On a fresh project with no
--    real data, drop them first by un-commenting the next lines:
-- drop table if exists public.orders cascade;
-- drop table if exists public.agents cascade;
-- drop table if exists public.payment_config cascade;

create extension if not exists pgcrypto;

-- ── Tables ───────────────────────────────────────────────────────────────────
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),   -- = auth.users.id for agents who log in
  name text not null,
  phone text,
  national_id text,
  email text unique,                               -- optional: lets an agent log in to /admin
  role text not null default 'Errand Agent',       -- Main Admin | Errand Agent | Delivery Guy | Supplier
  zone text not null default 'Rongai',             -- Rongai | Kiserian | CBD | Kitengela | Nairobi Wide
  status text not null default 'Active',           -- Active | Inactive
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  category text,
  from_location text not null,
  to_location text not null,
  stops jsonb not null default '[]'::jsonb,
  distance_km float not null default 0,
  duration_min int,
  traffic_level text,                              -- low | medium | high
  description text not null,
  file_url text,
  file_urls jsonb not null default '[]'::jsonb,
  customer_name text,
  customer_phone text,
  is_instant bool not null default false,
  total_price int not null default 0,
  payment_method text,
  status text not null default 'Pending',          -- Pending | Assigned | In Transit | Delivered
  payment_status text default 'Pending',
  agent_name text,
  agent_phone text,
  zone text,
  created_at timestamptz default now()   -- timestamptz so times display correctly in Nairobi
);
-- Live rider GPS (written only by /api/rider with the service-role key)
alter table public.orders add column if not exists rider_lat float;
alter table public.orders add column if not exists rider_lng float;
alter table public.orders add column if not exists rider_updated_at timestamptz;

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_zone_idx on public.orders (zone);

create table if not exists public.payment_config (
  id int primary key default 1 check (id = 1),
  mpesa_stk_enabled bool default true,
  mpesa_stk_key text,                              -- public shortcode/till only — Daraja secrets live in Vercel env
  paybill_enabled bool default false,
  paybill_number text,
  paypal_enabled bool default false,
  paypal_id text,
  card_enabled bool default false,
  card_key text,                                   -- PUBLIC/publishable key only
  last_saved timestamptz
);
insert into public.payment_config (id) values (1) on conflict (id) do nothing;

create table if not exists public.pricing_config (
  id int primary key default 1 check (id = 1),
  base_fee numeric not null default 80,
  per_km numeric not null default 12,
  traffic_multiplier numeric not null default 1,
  stop_fee numeric not null default 50,
  stop_km numeric not null default 3,
  instant_fee numeric not null default 100,
  ethical_mode bool not null default true,
  last_saved timestamptz
);
insert into public.pricing_config (id) values (1) on conflict (id) do nothing;

-- INTERNAL ONLY — never readable by customers (see RLS below).
create table if not exists public.competitor_benchmarks (
  name text primary key,
  min int not null,
  max int not null
);
insert into public.competitor_benchmarks (name, min, max) values
  ('Glovo', 350, 450), ('Uber Connect', 380, 480), ('Bolt', 250, 350)
on conflict (name) do nothing;

-- Secret per-order rider link token (/rider/{order_id}?t={token}). Admin-only.
create table if not exists public.rider_tokens (
  order_id uuid primary key references public.orders (id) on delete cascade,
  token text not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  description text not null,
  category text,
  supplier_contact text,
  customer_phone text,
  status text not null default 'New',
  created_at timestamptz not null default now()
);

-- ── Role helpers (security definer → no RLS recursion) ───────────────────────
create or replace function public.jwt_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.my_agent() returns public.agents
language sql stable security definer set search_path = public as $$
  select * from public.agents a
  where a.status <> 'Inactive'
    and (a.id = auth.uid() or (a.email is not null and lower(a.email) = public.jwt_email() and public.jwt_email() <> ''))
  limit 1
$$;

create or replace function public.is_main_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.jwt_email() = 'hello@lasavvy.co.ke' or coalesce((public.my_agent()).role = 'Main Admin', false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_main_admin() or (public.my_agent()).id is not null
$$;

create or replace function public.my_zone() returns text
language sql stable security definer set search_path = public as $$
  select (public.my_agent()).zone
$$;

-- ── Server-side price (customers can't tamper with total_price) ──────────────
create or replace function public.orders_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c public.pricing_config;
  traffic numeric;
  n_stops int;
begin
  select * into c from public.pricing_config where id = 1;
  traffic := case new.traffic_level when 'high' then 40 when 'medium' then 20 else 10 end;
  n_stops := coalesce(jsonb_array_length(new.stops), 0);
  -- distance_km already includes stop_km per stop
  -- same rounding as lib/pricing.ts calcPrice()
  new.total_price := round(c.base_fee) + round(new.distance_km * c.per_km) + round(traffic * c.traffic_multiplier)
                     + n_stops * c.stop_fee + case when new.is_instant then c.instant_fee else 0 end;
  if not public.is_admin() then
    new.user_id := auth.uid();
    new.status := 'Pending';
    new.payment_status := 'Pending';
    new.agent_name := null;
    new.agent_phone := null;
    new.rider_lat := null;
    new.rider_lng := null;
    new.rider_updated_at := null;
  end if;
  return new;
end $$;
drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert before insert on public.orders
  for each row execute function public.orders_before_insert();

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.agents enable row level security;
alter table public.orders enable row level security;
alter table public.payment_config enable row level security;
alter table public.pricing_config enable row level security;
alter table public.competitor_benchmarks enable row level security;
alter table public.quote_requests enable row level security;
alter table public.rider_tokens enable row level security;

-- agents
drop policy if exists agents_select on public.agents;
create policy agents_select on public.agents for select to authenticated
  using (public.is_main_admin() or id = auth.uid() or (email is not null and lower(email) = public.jwt_email())
         or (public.is_admin() and zone = public.my_zone()));
drop policy if exists agents_insert on public.agents;
create policy agents_insert on public.agents for insert to authenticated
  with check (public.is_main_admin() or (public.is_admin() and zone = public.my_zone() and role <> 'Main Admin'));
drop policy if exists agents_update on public.agents;
create policy agents_update on public.agents for update to authenticated
  using (public.is_main_admin() or (public.is_admin() and zone = public.my_zone() and role <> 'Main Admin'))
  with check (public.is_main_admin() or (zone = public.my_zone() and role <> 'Main Admin'));
drop policy if exists agents_delete on public.agents;
create policy agents_delete on public.agents for delete to authenticated using (public.is_main_admin());

-- orders
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert to authenticated with check (true); -- trigger pins user_id/price/status
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_main_admin() or (public.is_admin() and zone = public.my_zone()));
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated
  using (public.is_main_admin() or (public.is_admin() and zone = public.my_zone()))
  with check (public.is_main_admin() or (public.is_admin() and zone = public.my_zone()));
drop policy if exists orders_delete on public.orders;
create policy orders_delete on public.orders for delete to authenticated using (public.is_main_admin());

-- payment_config / pricing_config: anyone can read (checkout + price), Main Admin writes
drop policy if exists payment_config_read on public.payment_config;
create policy payment_config_read on public.payment_config for select to anon, authenticated using (true);
drop policy if exists payment_config_write on public.payment_config;
create policy payment_config_write on public.payment_config for all to authenticated using (public.is_main_admin()) with check (public.is_main_admin());

drop policy if exists pricing_config_read on public.pricing_config;
create policy pricing_config_read on public.pricing_config for select to anon, authenticated using (true);
drop policy if exists pricing_config_write on public.pricing_config;
create policy pricing_config_write on public.pricing_config for all to authenticated using (public.is_main_admin()) with check (public.is_main_admin());

-- competitor_benchmarks: Main Admin ONLY (never visible to clients)
drop policy if exists competitors_main_admin on public.competitor_benchmarks;
create policy competitors_main_admin on public.competitor_benchmarks for all to authenticated
  using (public.is_main_admin()) with check (public.is_main_admin());

-- rider_tokens: admins only (customers must never see them)
drop policy if exists rider_tokens_admin on public.rider_tokens;
create policy rider_tokens_admin on public.rider_tokens for all to authenticated
  using (public.is_main_admin() or (public.is_admin() and exists (select 1 from public.orders o where o.id = order_id and o.zone = public.my_zone())))
  with check (public.is_main_admin() or (public.is_admin() and exists (select 1 from public.orders o where o.id = order_id and o.zone = public.my_zone())));

-- quote_requests (Savvy Market)
drop policy if exists quotes_insert on public.quote_requests;
create policy quotes_insert on public.quote_requests for insert to authenticated with check (user_id = auth.uid());
drop policy if exists quotes_select on public.quote_requests;
create policy quotes_select on public.quote_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists quotes_update on public.quote_requests;
create policy quotes_update on public.quote_requests for update to authenticated using (public.is_admin());

-- ── Realtime (live /track/[id] + admin dashboard) ────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;

-- ── Storage: public bucket mtaani-files (orders/{Date.now()}-{filename}) ─────
insert into storage.buckets (id, name, public, file_size_limit)
values ('mtaani-files', 'mtaani-files', true, 10485760)
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists "mtaani-files upload" on storage.objects;
create policy "mtaani-files upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'mtaani-files' and (storage.foldername(name))[1] = 'orders');
drop policy if exists "mtaani-files read" on storage.objects;
create policy "mtaani-files read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'mtaani-files');

-- ════════════════════════════════════════════════════════════════════════════
-- MAIN ADMIN
-- 1. Supabase → Authentication → Users → "Add user" → hello@lasavvy.co.ke + a strong
--    password (tick "Auto confirm").
-- 2. Run the statement below — it looks up that user's UUID and inserts the Main Admin row.
--    (Or insert manually: values ('<UUID>', 'Main Admin', 'hello@lasavvy.co.ke', 'Main Admin', ...).)
-- ════════════════════════════════════════════════════════════════════════════
insert into public.agents (id, name, email, role, zone, status)
select u.id, 'Main Admin', lower(u.email), 'Main Admin', 'Nairobi Wide', 'Active'
from auth.users u where lower(u.email) = 'hello@lasavvy.co.ke'
on conflict (id) do update set role = 'Main Admin', status = 'Active';
-- (The hello@lasavvy.co.ke login is treated as Main Admin even before this row exists.)
--
-- MINOR ADMINS (zone-limited): add them in /admin/agents with a login email, then create an
-- auth user with that same email in Authentication → Users. They see only their zone.
--
-- CUSTOMER PHONE OTP: Authentication → Providers → Phone → enable, and connect an SMS
-- provider (Twilio / MessageBird / Vonage / Textlocal). Codes are 6 digits.

-- Mtaani Errands • LA & Savvy Limited • Rongai, Nairobi, Kenya
-- Schema + Row Level Security. Roles: main_admin > minor_admin (zone-limited) > customer.
-- The admin portal uses the service-role key server-side (bypasses RLS after its own checks);
-- these policies protect any direct access with the anon key (mobile app, Supabase Realtime).

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('main_admin', 'minor_admin', 'customer')),
  zone text check (zone in ('Rongai', 'Kiserian', 'CBD', 'Kitengela', 'Nairobi Wide')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.agents (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  phone text not null unique,
  national_id text not null,
  role text not null check (role in ('Errand Agent', 'Delivery Guy', 'Supplier')),
  zone text not null check (zone in ('Rongai', 'Kiserian', 'CBD', 'Kitengela', 'Nairobi Wide')),
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  online boolean not null default false,
  access_code_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text,
  code text not null unique,
  customer_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  category text not null,
  from_label text not null,
  to_label text not null,
  zone text not null,
  distance_km double precision not null,
  tier text not null check (tier in ('scheduled', 'instant')),
  total_kes integer not null check (total_kes >= 0),
  payment_method text,
  status text not null default 'Pending' check (status in ('Pending', 'Assigned', 'In Transit', 'Delivered')),
  agent_id text references public.agents (id) on delete set null,
  to_lat double precision,
  to_lng double precision,
  created_at timestamptz not null default now()
);
create index if not exists orders_zone_idx on public.orders (zone, status);

create table if not exists public.suppliers (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  zone text not null,
  vetting_status text not null default 'Pending Review' check (vetting_status in ('Pending Review', 'Approved', 'Rejected')),
  documents jsonb not null default '[]'::jsonb,
  margin_pct double precision not null default 15,
  notes text not null default '',
  last_reminder_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id text primary key default gen_random_uuid()::text,
  customer_id uuid references auth.users (id) on delete set null,
  description text not null,
  category text not null,
  supplier_contact text not null default '',
  customer_phone text not null,
  status text not null default 'New' check (status in ('New', 'Quoted', 'Closed')),
  created_at timestamptz not null default now()
);

-- Key/value settings. PUBLIC keys: payment_config, pricing_config.
-- PRIVATE keys (Main Admin only): fair_cap, competitor_benchmarks, payment_secrets.
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- helpers ----------
create or replace function public.is_main_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'main_admin');
$$;

create or replace function public.my_zone() returns text
language sql stable security definer set search_path = public as $$
  select zone from profiles where id = auth.uid() and role = 'minor_admin';
$$;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.orders enable row level security;
alter table public.suppliers enable row level security;
alter table public.quote_requests enable row level security;
alter table public.settings enable row level security;

create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_main_admin());
create policy profiles_admin_write on public.profiles for all using (public.is_main_admin()) with check (public.is_main_admin());

create policy agents_main on public.agents for all using (public.is_main_admin()) with check (public.is_main_admin());
create policy agents_zone_read on public.agents for select using (zone = public.my_zone());

create policy orders_main on public.orders for all using (public.is_main_admin()) with check (public.is_main_admin());
create policy orders_zone_read on public.orders for select using (zone = public.my_zone());
create policy orders_zone_update on public.orders for update using (zone = public.my_zone()) with check (zone = public.my_zone());
create policy orders_customer_read on public.orders for select using (customer_id = auth.uid());

create policy suppliers_main on public.suppliers for all using (public.is_main_admin()) with check (public.is_main_admin());

create policy quotes_main on public.quote_requests for all using (public.is_main_admin()) with check (public.is_main_admin());
create policy quotes_customer_insert on public.quote_requests for insert with check (customer_id = auth.uid());
create policy quotes_customer_read on public.quote_requests for select using (customer_id = auth.uid());

create policy settings_public_read on public.settings for select using (key in ('payment_config', 'pricing_config'));
create policy settings_main on public.settings for all using (public.is_main_admin()) with check (public.is_main_admin());

-- Realtime for live order boards
alter publication supabase_realtime add table public.orders;

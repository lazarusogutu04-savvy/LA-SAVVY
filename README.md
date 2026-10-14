# Mtaani Errands — by LA & Savvy Limited

Ethical, transparent errands & delivery from **Rongai, Nairobi, Kenya**.
hello@lasavvy.co.ke • [www.lasavvy.co.ke](https://www.lasavvy.co.ke)

| App | Stack | Folder |
| --- | --- | --- |
| Admin web portal + public website + web booking | Next.js 14 App Router, Tailwind, shadcn/ui, Lucide | `apps/admin` |
| Client mobile app | React Native, Expo SDK 57, Expo Router | `apps/mobile` |
| Shared design tokens + ethical pricing formula (client-safe) | TypeScript | `packages/shared` |
| Database, auth, RLS | Supabase (Postgres, Auth, Storage, Realtime) | `supabase/` |
| Master logo (exact supplied artwork) | PNG | `brand/` |

Both apps run **immediately in demo mode** (no keys needed). Every key in `.env.example` is
`"Will be provided later"` until you have it.

---

## File structure

```
LA-SAVVY/
├── .env.example                 # every key = "Will be provided later"
├── brand/                       # master-logo.jpg (original) + logo-mark / logo-full / app-icon crops
├── docs/
│   ├── DEPLOY_IPHONE.md         # deploy to Vercel from the iPhone Claude app
│   └── reference/               # the reference images this build follows
├── packages/shared/src/
│   ├── brand.ts                 # #0F3D2E #7A1C1C #C4A77D #FFFEF8 #E8F5E9, zones, roles
│   ├── pricing.ts               # Base + km × rate + traffic × rate (+ tier adjustment)
│   ├── routes.ts                # 22 km CBD → Shangrila Villas benchmark route
│   └── types.ts
├── apps/admin/                  # Next.js 14 → deploy to Vercel (Root Directory = apps/admin)
│   ├── app/
│   │   ├── page.tsx             # public site: header Home • Services • Mtaani • Savvy • About + Book an Errand
│   │   ├── book/                # web client: route + traffic map → Ethical Pricing → Checkout
│   │   ├── login/               # Main Admin (email+password) / Zone Admin (phone + access code)
│   │   ├── admin/
│   │   │   ├── page.tsx         # Dashboard: orders, revenue, active agents, ethical pricing monitor
│   │   │   ├── payments/        # STEP 1 Payment Configuration
│   │   │   ├── pricing/         # Pricing Config + internal competitor benchmark (Main Admin only)
│   │   │   ├── users/           # STEP 4 User Management + Assign Delivery + WhatsApp
│   │   │   ├── orders/          # Pending / Assigned / In Transit / Delivered, map, WhatsApp
│   │   │   ├── suppliers/       # vetting, expiry alerts, reminder emails, margin tracking, quotes
│   │   │   └── actions.ts       # server actions (role-checked)
│   │   └── api/
│   │       ├── public/          # config, quote, route, orders, quote-requests (used by mobile)
│   │       ├── payments/mpesa/  # Daraja STK push + callback
│   │       └── cron/            # daily supplier-expiry reminders (vercel.json)
│   ├── components/ui/           # shadcn/ui (button, card, input, switch, dialog, badge, table…)
│   ├── components/brand/        # logo, header, footer, payment icons
│   ├── components/client/       # ethical pricing cards, traffic map
│   ├── lib/server/              # db (Supabase / demo store), auth, pricing, fair-cap (server-only), mpesa…
│   └── middleware.ts            # protects /admin, zone limits, CORS for the mobile app
├── apps/mobile/src/
│   ├── app/                     # index (splash) • login • otp • (tabs)/index (home) • (tabs)/market
│   │                            # route • pricing • checkout • success
│   ├── components/              # ui kit, Logo, TrafficMap (native + web), PaymentIcon
│   └── lib/                     # api, auth (Supabase phone OTP), booking state
└── supabase/
    ├── migrations/0001_init.sql # tables + Row Level Security (main_admin > minor_admin > customer)
    └── seed.sql
```

---

## Ethical pricing

Customers only ever see one formula:

```
price = Base 80 + distance × 12 + traffic minutes × 1  (+ tier adjustment)
```

| Tier | Benchmark: CBD → Shangrila Villas Rongai, 22 km, 36 min traffic delay |
| --- | --- |
| **Scheduled Standard** (60–90 min, batch) | 80 + 264 + 16 (off-peak window, 45% of delay) − 80 pooled saving = **KES 280** |
| **Instant Premium** (25–40 min, direct) | 80 + 264 + 36 = **KES 380** formula price |

**Hidden fair-price ceiling (server only):** `customerPrice = min(formula, competitorAvg × 0.85)`.
Competitor benchmarks (Glovo 350–450, Uber 380–480, Bolt 250–350) live only in
`apps/admin/lib/server/fair-cap.ts` and the Main-Admin-only Pricing Config page. They are never in
`packages/shared`, the mobile bundle, or any public API response. When the ceiling lowers a price,
the customer sees a neutral "Fair-price ceiling" line in the breakdown, with no competitor names.

> ⚠️ **With the default benchmarks, Instant comes out at KES 320, not 380.** The average is 376.67,
> and × 0.85 gives a ceiling of KES 320, which is below the 380 formula price. That is the ceiling
> doing its job. To show KES 380, either switch **Fair-price ceiling** off in *Admin → Pricing*, or
> raise the benchmarks (the average must be ≥ KES 447). Scheduled stays at KES 280 either way.

---

## Roles & security

- **Main Admin** signs in with `MAIN_ADMIN_EMAIL` and `MAIN_ADMIN_PASSWORD`. Only the Main Admin
  can manage payments, pricing, users and suppliers.
- **Minor admins** (Errand Agent / Delivery Guy / Supplier) are added by the Main Admin. Each gets
  a one-time 6-digit access code (stored hashed) that is shared over WhatsApp. They sign in on the
  *Zone Admin* tab and see **only their zone's orders**. Middleware and server actions both enforce this.
- Order totals are **always recomputed on the server**. A total sent by the client is ignored.
- Payment fields show **"Will be provided later"** until the Main Admin saves a value. Secret
  fields (card API keys) are write-only and never returned to clients.
- Supabase **Row Level Security**: `is_main_admin()` / `my_zone()` policies, public read only for
  `payment_config` and `pricing_config` settings, competitor data is Main-Admin-only.
- Demo login (`admin@lasavvy.co.ke` / `mtaani-demo`) works only while `MAIN_ADMIN_PASSWORD` is
  unset, and is refused entirely once Supabase is connected.

---

## Run locally

```bash
# Admin portal → http://localhost:3000  (login: admin@lasavvy.co.ke / mtaani-demo)
cd apps/admin && npm install && npm run dev

# Mobile app → scan the QR code with Expo Go on your iPhone
cd apps/mobile && npm install && npx expo start
```

Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to your Vercel URL so the app uses live pricing,
payment config and orders. Without it the app shows offline estimates.

## Deploy

See **[docs/DEPLOY_IPHONE.md](docs/DEPLOY_IPHONE.md)** for the full iPhone-only flow (Vercel + Supabase + Expo).

---

© 2025 LA & Savvy Limited • Rongai, Nairobi, Kenya

# LA & SAVVY Mtaani Errands — by LA & Savvy Limited

On-demand errands & delivery from **Rongai, Nairobi, Kenya** • hello@lasavvy.co.ke
**Fair, Transparent, Ethical pricing - No surge**

The Next.js 14 app now lives at the **repository root** so Vercel builds it with no extra
settings (Vercel → Project → Settings → Build → **Root Directory must be empty / `./`**).

| Route | What it does |
| --- | --- |
| `/` | Splash screen with logo → `/book` (signed in) or `/auth` |
| `/auth` | Phone (07…) → 6-digit SMS OTP (`signInWithOtp` / `verifyOtp type sms`, +254 formatting) |
| `/book` | Category chips, From/To with Google Places, multi-stop, live DistanceMatrix traffic pricing, description, attachments, 4 payment methods, Pay |
| `/track`, `/track/[id]` | My orders + live tracking (Supabase Realtime), timeline, rider card + WhatsApp, payment instructions |
| `/admin/login` | Email + password (`signInWithPassword`), checks `agents` role Main Admin or hello@lasavvy.co.ke |
| `/admin` | Stats, latest 20 orders, Assign Delivery, Share via WhatsApp, status updates (live) |
| `/admin/agents` | Add Minor Admin (name, phone, ID, role, zone), Active toggle, zone filter, assign + WhatsApp |
| `/admin/pricing` | Main Admin only: formula inputs, internal competitor table (never shown to clients), Ethical mode |
| `/admin/payments` | Main Admin only: M-Pesa STK, Paybill, PayPal, Card toggles + fields, last saved |
| `/rider/[id]?t=…` | Rider page (no login): Start trip → shares phone GPS every ~15 s, Mark Delivered. Link is sent in the admin's WhatsApp share after Assign Delivery |
| `/api/mpesa/stk`, `/api/mpesa/callback` | Daraja STK Push (falls back to manual Till 123456 until keys exist), signed callback |

## Pricing (the only formula customers see)

```
Scheduled = Base 80 + km × 12 + traffic fee (low 10 / medium 20 / high 40) × multiplier + stops × 50
            (each stop also adds 3 km)          traffic = duration_in_traffic / duration: >1.5 high, >1.2 medium
Instant   = Scheduled + 100
```
All values are editable in `/admin/pricing`. Supabase recomputes `total_price` in a database
trigger, so a customer cannot change the price they pay.

## Live rider GPS (low cost)

Assign Delivery creates a secret rider link, and **Share via WhatsApp** sends it to the rider. The rider
taps *Start trip*: the order goes **In Transit** and the phone's GPS is sent every ~15 s (or after moving
50 m) while the page stays open. The customer's `/track/[id]` map moves live through Supabase Realtime.
- GPS is free, and the position updates use your existing Supabase plan.
- With the Google Maps key, each tracking page view loads one map, which is covered by Google's monthly free credit.
  Without the key, the map uses free OpenStreetMap.
- Phone browsers pause GPS when the screen is off, so riders should keep the page open. The page asks the
  phone to keep the screen awake.

## Demo mode (before keys arrive)

Every key in `.env.example` is `"Will be provided later"`. Until they are set, the app works in demo mode:
data is saved in the browser, any 6-digit OTP works, admin login is `hello@lasavvy.co.ke` / `mtaani-demo`,
and the book page asks for an approximate km instead of using live Google Maps.

## Going live — 4 steps

1. **Supabase:** create a project → SQL Editor → run `supabase/schema.sql` (tables, RLS, trigger,
   Realtime, `mtaani-files` bucket). Authentication → Users → add `hello@lasavvy.co.ke`, then run the
   "MAIN ADMIN" statement at the bottom of the file. Authentication → Providers → Phone → enable an SMS provider.
2. **Google Maps:** enable Maps JavaScript, Places, Distance Matrix and Directions APIs; restrict the key to `la-savvy.vercel.app`.
3. **Vercel → Settings → Environment Variables:** add the values from `.env.example`, then redeploy.
4. **M-Pesa:** add the Daraja keys. Until then customers are shown Till 123456.

## Run locally

```bash
npm install && npm run dev     # http://localhost:3000
```

## Other folders

- `apps/admin/` — previous v1 admin portal (kept for history; no longer deployed)
- `apps/mobile/` — Expo React Native app (unchanged)
- `packages/shared/`, `supabase/migrations/` — v1 code used by the folders above
- `brand/` — master logo (unchanged)

---

© LA & Savvy Limited • Rongai, Nairobi, Kenya

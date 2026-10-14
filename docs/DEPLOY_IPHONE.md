# Deploy Mtaani Errands from your iPhone

You don't need a computer. Everything below works in Safari or the Claude app on iPhone.

## 1. Admin portal + website → Vercel (about 5 minutes)

1. In Safari, open **https://vercel.com/new** and sign in with GitHub.
2. Under **Import Git Repository**, pick **`lazarusogutu04-savvy/LA-SAVVY`**.
   (If it isn't listed, tap *Adjust GitHub App Permissions* and give Vercel access to the repo.)
3. Set **Root Directory** to **`apps/admin`**. Vercel detects the framework as Next.js automatically.
4. Open **Environment Variables** and add at least these two:
   - `MAIN_ADMIN_PASSWORD`: your strong admin password
   - `ADMIN_SESSION_SECRET`: 32+ random characters (any password generator)

   Everything else from `.env.example` can stay "Will be provided later" for now.
5. Tap **Deploy**. When it finishes you get a URL such as `https://la-savvy.vercel.app`:
   - `/` is the public site (Home • Services • Mtaani • Savvy • About • **Book an Errand**)
   - `/book` is the client Ethical Pricing + Checkout flow
   - `/login` is the admin portal (Main Admin uses `admin@lasavvy.co.ke` + your password)
6. Optional: add `NEXT_PUBLIC_SITE_URL` (your Vercel URL) and `CRON_SECRET` so the daily supplier
   reminder cron is enabled. Then **Deployments → ⋯ → Redeploy**.

> Prefer one tap? Ask Claude in this chat to *"deploy apps/admin to Vercel"*. This session has a
> Vercel connector and can create the project for you.

Until Supabase is connected, the portal runs on a demo data store. It works, but data resets when
Vercel restarts the server.

## 2. Database → Supabase (about 5 minutes)

1. Open **https://supabase.com/dashboard**, then **New project**. Choose region *eu-central* or the
   closest to Nairobi.
2. Go to **SQL Editor → New query**. Paste the contents of `supabase/migrations/0001_init.sql`
   and tap **Run**. Then do the same with `supabase/seed.sql`.
3. Under **Project Settings → API**, copy these into Vercel's environment variables:
   - Project URL goes in `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key goes in `SUPABASE_ANON_KEY`
   - `service_role` key goes in `SUPABASE_SERVICE_ROLE_KEY` (secret, server only)
4. In Vercel, **Redeploy**. The sidebar footer then shows **Data: Supabase (live)**.
5. For customer phone OTP, go to **Authentication → Providers → Phone**, enable it, and connect an
   SMS provider (Twilio or MessageBird; Africa's Talking via a hook).

## 3. Payments (whenever keys arrive)

- **M-Pesa (Daraja):** add `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE` and
  `MPESA_PASSKEY`, and set `MPESA_ENV=production` when Safaricom approves you. The callback URL is
  `https://<your-domain>/api/payments/mpesa/callback`.
- Then in **Admin → Payments**, toggle methods on or off and enter the public Paybill / Till
  number. Fields show "Will be provided later" until saved. Changes apply to checkout instantly.

## 4. Mobile app (Expo)

- **Try it now on iPhone:** install **Expo Go** from the App Store. On any computer (or a GitHub
  Codespace opened from Safari) run `cd apps/mobile && npm install && npx expo start --tunnel`,
  then scan the QR code with the iPhone camera.
- **Build for the App Store without a Mac:** create a free account at **https://expo.dev**, then
  run `npx eas-cli@latest build -p ios` from `apps/mobile`. EAS builds in the cloud and can
  submit to TestFlight with `eas submit`.
- Before building, set `EXPO_PUBLIC_API_URL` to your Vercel URL in `apps/mobile/.env` (or under
  EAS environment variables). Also set the Supabase and Google Maps `EXPO_PUBLIC_*` keys when you
  have them.

## 5. Custom domain

In Vercel, go to **Project → Settings → Domains**, add `www.lasavvy.co.ke`, and create the DNS
records Vercel shows you at your domain registrar.

---

© 2025 LA & Savvy Limited • Rongai, Nairobi, Kenya

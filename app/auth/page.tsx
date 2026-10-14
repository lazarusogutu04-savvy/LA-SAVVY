"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Phone } from "lucide-react";
import { LogoFull } from "@/components/brand/logo";
import { DemoBanner } from "@/components/demo-banner";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCustomer, sendOtp, verifyOtp } from "@/lib/auth";
import { company } from "@/lib/config";
import { demoMode } from "@/lib/supabase";
import { isKePhone } from "@/lib/utils";

function AuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/book";
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [e164, setE164] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCustomer().then((c) => c && router.replace(next));
  }, [router, next]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isKePhone(phone)) return setError("Enter a valid Kenyan number, e.g. 0712 345 678");
    setBusy(true);
    try {
      setE164(await sendOtp(phone));
      setStep("otp");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(e164, code);
      router.replace(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <DemoBanner />
      <div className="bg-jungle px-6 pb-10 pt-10 text-center text-white">
        <LogoFull width={130} className="mx-auto shadow-xl" />
        <h1 className="mt-4 font-heading text-xl text-gold">Welcome to Mtaani Errands</h1>
        <p className="mt-1 text-sm text-white/80">{company.tagline}</p>
      </div>
      <main className="mx-auto -mt-6 max-w-md px-4">
        <div className="rounded-card border border-line bg-white p-5 shadow-soft">
          {step === "phone" ? (
            <form onSubmit={onSend} className="space-y-4">
              <div>
                <h2 className="text-lg text-jungle">Log in or register</h2>
                <p className="text-sm text-muted">We&apos;ll send a 6-digit code by SMS. New numbers are registered automatically.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <div className="flex gap-2">
                  <span className="flex h-11 items-center rounded-btn border border-line bg-mint px-3 text-sm font-semibold text-jungle">🇰🇪 +254</span>
                  <Input id="phone" inputMode="tel" autoComplete="tel" placeholder="07..." value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-sm font-medium text-maroon">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Phone />} Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={onVerify} className="space-y-4">
              <button type="button" onClick={() => setStep("phone")} className="inline-flex items-center gap-1 text-sm font-semibold text-jungle">
                <ArrowLeft className="h-4 w-4" /> Change number
              </button>
              <div>
                <h2 className="text-lg text-jungle">Enter the code</h2>
                <p className="text-sm text-muted">Sent to {e164}</p>
                {demoMode && <p className="mt-1 text-xs text-[#6E5630]">Demo mode: any 6 digits work.</p>}
              </div>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••••"
                className="h-14 text-center text-2xl tracking-[0.5em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              {error && <p className="text-sm font-medium text-maroon">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={busy || code.length !== 6}>
                {busy && <Loader2 className="animate-spin" />} Verify &amp; continue
              </Button>
              <button type="button" disabled={busy} onClick={() => sendOtp(phone).catch((e) => setError(e.message))} className="w-full text-center text-sm text-jungle underline">
                Resend code
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthInner />
    </Suspense>
  );
}

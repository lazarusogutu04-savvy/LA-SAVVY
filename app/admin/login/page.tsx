"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminSignIn, getAdminSession } from "@/lib/auth";
import { company, DEMO_ADMIN_PASSWORD, MAIN_ADMIN_EMAIL } from "@/lib/config";
import { demoMode } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminSession().then((s) => s && router.replace("/admin"));
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminSignIn(email, password);
      router.replace("/admin");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-jungle px-4 py-10">
      <div className="w-full max-w-sm rounded-card bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-full bg-gold p-1">
            <LogoMark size={44} className="rounded-full" />
          </span>
          <div>
            <h1 className="font-heading text-lg text-jungle">LA &amp; SAVVY - Admin</h1>
            <p className="text-xs text-muted">Mtaani Errands web portal</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="username" placeholder={MAIN_ADMIN_EMAIL} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm font-medium text-maroon">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <LogIn />} Log in
          </Button>
        </form>
        {demoMode && (
          <p className="mt-4 rounded-btn bg-gold-100 p-2.5 text-xs text-[#6E5630]">
            Demo mode (Supabase keys will be provided later): {MAIN_ADMIN_EMAIL} / {DEMO_ADMIN_PASSWORD}
          </p>
        )}
        <p className="mt-5 text-center text-[11px] text-muted">{company.footer}</p>
      </div>
    </main>
  );
}

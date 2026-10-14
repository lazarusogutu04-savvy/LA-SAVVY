"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginMainAdmin, loginMinorAdmin } from "./actions";
import { cn } from "@/lib/utils";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      <Lock /> {pending ? "Signing in…" : children}
    </Button>
  );
}

export function LoginForms({ next, demo }: { next: string; demo: boolean }) {
  const [tab, setTab] = useState<"main" | "minor">("main");
  const [mainState, mainAction] = useFormState(loginMainAdmin, {});
  const [minorState, minorAction] = useFormState(loginMinorAdmin, {});
  return (
    <Card className="p-6">
      <div className="mb-5 grid grid-cols-2 rounded-btn bg-mint p-1 text-sm font-semibold">
        {(["main", "minor"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-[10px] py-2", tab === t ? "bg-white text-maroon shadow" : "text-jungle")}>
            {t === "main" ? "Main Admin" : "Zone Admin"}
          </button>
        ))}
      </div>
      {tab === "main" ? (
        <form action={mainAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required placeholder="admin@lasavvy.co.ke" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {mainState.error && <p className="text-sm font-medium text-maroon">{mainState.error}</p>}
          <Submit>Sign in securely</Submit>
          {demo && (
            <p className="rounded-btn bg-gold-100 p-3 text-xs text-[#6E5630]">
              Demo mode: admin@lasavvy.co.ke / <b>mtaani-demo</b>. Set <code>MAIN_ADMIN_PASSWORD</code> in Vercel to lock this down.
            </p>
          )}
        </form>
      ) : (
        <form action={minorAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" inputMode="tel" required placeholder="+254712345678" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">Access code</Label>
            <Input id="code" name="code" inputMode="numeric" required placeholder="6-digit code from Main Admin" />
          </div>
          {minorState.error && <p className="text-sm font-medium text-maroon">{minorState.error}</p>}
          <Submit>Sign in to my zone</Submit>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 text-jungle" /> Zone admins see orders for their assigned zone only.
          </p>
        </form>
      )}
    </Card>
  );
}

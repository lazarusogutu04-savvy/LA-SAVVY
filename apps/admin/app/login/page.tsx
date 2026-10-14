import { LogoFull } from "@/components/brand/logo";
import { usingDemoPassword } from "@/lib/server/auth";
import { LoginForms } from "./login-forms";
import { company } from "@shared";

export const metadata = { title: "Admin Login" };
export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-jungle px-4 py-10">
      <LogoFull width={180} />
      <p className="mt-3 font-heading text-lg text-white/90">Mtaani Errands • Admin Portal</p>
      <div className="mt-6 w-full max-w-sm">
        <LoginForms next={searchParams.next ?? "/admin"} demo={usingDemoPassword()} />
      </div>
      <p className="mt-8 text-center text-xs text-white/60">{company.footer}</p>
    </main>
  );
}

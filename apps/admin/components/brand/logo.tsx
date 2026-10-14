import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Master logo — uses the exact supplied artwork (public/logo-mark.png, public/logo-full.png).
 * Never redraw: S with curl hook, maroon half-circle, gold LA monogram, no crowns.
 */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt="LA & Savvy Limited"
      width={size}
      height={size}
      priority
      className={cn("rounded-[10px]", className)}
    />
  );
}

export function LogoLockup({ subtitle = "Mtaani Errands", light = true }: { subtitle?: string; light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={40} />
      <span className="leading-tight">
        <span className={cn("block font-heading text-[15px] font-bold tracking-wide", light ? "text-gold" : "text-jungle")}>LA &amp; SAVVY LIMITED</span>
        <span className={cn("block text-xs", light ? "text-white/80" : "text-muted")}>{subtitle}</span>
      </span>
    </span>
  );
}

export function LogoFull({ width = 220, className }: { width?: number; className?: string }) {
  return <Image src="/logo-full.png" alt="LA & Savvy Limited" width={width} height={Math.round((width * 520) / 442)} priority className={cn("rounded-card", className)} />;
}

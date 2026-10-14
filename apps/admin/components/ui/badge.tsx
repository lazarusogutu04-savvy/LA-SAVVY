import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-maroon text-white",
      gold: "bg-gold-100 text-[#6E5630] ring-1 ring-gold",
      mint: "bg-mint text-jungle",
      muted: "bg-[#EEEBE4] text-muted",
      success: "bg-[#2E9D4F] text-white",
      warning: "bg-[#F2B33D] text-[#4A3500]",
      danger: "bg-[#C0392B] text-white",
      info: "bg-[#DCE8F7] text-[#1C4E80]",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

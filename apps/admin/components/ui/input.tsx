import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-btn border border-line bg-[#F4F2EC] px-3.5 text-[15px] text-ink placeholder:text-[#7C7C7C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[90px] w-full rounded-btn border border-line bg-[#F4F2EC] px-3.5 py-2.5 text-[15px] placeholder:text-[#7C7C7C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-11 w-full appearance-none rounded-btn border border-line bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%230F3D2E%22 stroke-width=%222%22><path d=%22m4 6 4 4 4-4%22/></svg>')] bg-[right_12px_center] bg-no-repeat px-3.5 pr-9 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
      className
    )}
    {...props}
  />
));
NativeSelect.displayName = "NativeSelect";

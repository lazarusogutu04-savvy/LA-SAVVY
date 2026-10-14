import type { PaymentMethodKey } from "@shared";

/** Simple, neutral payment glyphs (not official trademarks). */
export function PaymentIcon({ method, size = 44 }: { method: PaymentMethodKey; size?: number }) {
  if (method === "mpesa_stk" || method === "mpesa_paybill") {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden>
        <circle cx="22" cy="22" r="21" fill="#E8F5E9" />
        <path d="M22 1a21 21 0 0 1 0 42" fill="#DCEFE0" />
        <text x="22" y="29" textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="20" fill="#2E9D4F">M</text>
        <circle cx="33" cy="12" r="4" fill={method === "mpesa_stk" ? "#7A1C1C" : "#C4A77D"} />
      </svg>
    );
  }
  if (method === "paypal") {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden>
        <rect width="44" height="44" rx="12" fill="#EEF3FB" />
        <text x="22" y="30" textAnchor="middle" fontFamily="Poppins, sans-serif" fontStyle="italic" fontWeight="800" fontSize="22" fill="#1F4F9C">P</text>
      </svg>
    );
  }
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 70 44" aria-hidden>
      <rect x="0.5" y="8.5" width="36" height="26" rx="4" fill="#fff" stroke="#E7E2D6" />
      <text x="18.5" y="26" textAnchor="middle" fontFamily="Poppins, sans-serif" fontStyle="italic" fontWeight="800" fontSize="11" fill="#1A1F71">VISA</text>
      <circle cx="49" cy="21.5" r="9" fill="#EB001B" />
      <circle cx="59" cy="21.5" r="9" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  );
}

import Svg, { Circle, Path, Rect, Text as SvgText } from "react-native-svg";
import type { PaymentMethodKey } from "@shared";

export function PaymentIcon({ method, size = 42 }: { method: PaymentMethodKey; size?: number }) {
  if (method === "mpesa_stk" || method === "mpesa_paybill") {
    return (
      <Svg width={size} height={size} viewBox="0 0 44 44">
        <Circle cx="22" cy="22" r="21" fill="#E8F5E9" />
        <Path d="M22 1a21 21 0 0 1 0 42" fill="#DCEFE0" />
        <SvgText x="22" y="29" textAnchor="middle" fontWeight="800" fontSize="20" fill="#2E9D4F">M</SvgText>
        <Circle cx="33" cy="12" r="4" fill={method === "mpesa_stk" ? "#7A1C1C" : "#C4A77D"} />
      </Svg>
    );
  }
  if (method === "paypal") {
    return (
      <Svg width={size} height={size} viewBox="0 0 44 44">
        <Rect width="44" height="44" rx="12" fill="#EEF3FB" />
        <SvgText x="22" y="30" textAnchor="middle" fontStyle="italic" fontWeight="800" fontSize="22" fill="#1F4F9C">P</SvgText>
      </Svg>
    );
  }
  return (
    <Svg width={size * 1.6} height={size} viewBox="0 0 70 44">
      <Rect x="0.5" y="8.5" width="36" height="26" rx="4" fill="#fff" stroke="#E7E2D6" />
      <SvgText x="18.5" y="26" textAnchor="middle" fontStyle="italic" fontWeight="800" fontSize="11" fill="#1A1F71">VISA</SvgText>
      <Circle cx="49" cy="21.5" r="9" fill="#EB001B" />
      <Circle cx="59" cy="21.5" r="9" fill="#F79E1B" fillOpacity={0.9} />
    </Svg>
  );
}

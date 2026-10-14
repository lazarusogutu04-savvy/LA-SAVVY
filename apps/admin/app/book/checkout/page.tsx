import { Suspense } from "react";
import { Checkout } from "./checkout";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <Suspense>
      <Checkout />
    </Suspense>
  );
}

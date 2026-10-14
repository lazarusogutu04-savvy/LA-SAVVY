import { requireMainAdmin } from "@/lib/server/auth";
import { getPaymentConfig } from "@/lib/server/payments";
import { PaymentConfigForm } from "./payment-config-form";

export const metadata = { title: "Payment Configuration" };
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireMainAdmin();
  const cfg = await getPaymentConfig();
  return <PaymentConfigForm initial={cfg} />;
}

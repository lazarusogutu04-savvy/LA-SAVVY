"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, FileText, Loader2, MapPin, MessageCircle, Phone, Smartphone } from "lucide-react";
import { RiderMap } from "@/components/client/rider-map";
import { DemoBanner } from "@/components/demo-banner";
import { MasterHeader } from "@/components/master-header";
import { SiteFooter } from "@/components/site-footer";
import { useCustomer } from "@/components/use-customer";
import { Button } from "@/components/ui/button";
import { MANUAL_TILL } from "@/lib/config";
import { getOrder, getPaymentConfig, subscribeOrder } from "@/lib/data";
import { ORDER_STEPS, type Order, type PaymentConfig } from "@/lib/types";
import { cn, formatDate, kes, shortId, waLink } from "@/lib/utils";

export default function TrackOrder({ params }: { params: { id: string } }) {
  const { ready } = useCustomer();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [pay, setPay] = useState<PaymentConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    getOrder(params.id)
      .then(setOrder)
      .catch((e) => setError(e.message));
    getPaymentConfig().then(setPay).catch(() => undefined);
    // Realtime: live status / agent / payment updates without refresh.
    return subscribeOrder(params.id, setOrder);
  }, [ready, params.id]);

  const stepIndex = order ? ORDER_STEPS.indexOf(order.status) : -1;
  const paid = order?.payment_status === "Paid";
  const paybill = order?.payment_method === "mpesa_paybill" && pay?.paybill_number ? pay.paybill_number : null;

  return (
    <div className="min-h-screen bg-cream">
      <MasterHeader />
      <DemoBanner />
      <main className="mx-auto max-w-md space-y-4 px-4 py-5">
        {order === undefined && !error && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-jungle" />}
        {error && <p className="text-sm text-maroon">{error}</p>}
        {order === null && (
          <div className="rounded-card border border-line bg-white p-6 text-center shadow-soft">
            <p className="font-semibold text-jungle">Order not found</p>
            <Button asChild className="mt-4">
              <Link href="/track">My orders</Link>
            </Button>
          </div>
        )}
        {order && (
          <>
            <div className="overflow-hidden rounded-card shadow-soft">
              <div className="flex items-center justify-between bg-jungle px-4 py-3 text-white">
                <div>
                  <p className="text-xs text-white/70">Order</p>
                  <p className="font-heading font-bold">#{shortId(order.id)}</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-jungle">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-maroon" /> Live Tracking
                </span>
              </div>
              <div className="space-y-2 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-jungle">
                    {order.from_location} → {order.to_location}
                  </p>
                  <p className="shrink-0 text-xl font-bold text-maroon">{kes(order.total_price)}</p>
                </div>
                <p className="text-sm text-muted">
                  {order.distance_km} km • ~{order.duration_min} min • {order.is_instant ? "Instant Premium" : "Scheduled Standard"}
                  {order.stops.length > 0 && ` • ${order.stops.length} stop${order.stops.length > 1 ? "s" : ""}`}
                </p>
                {order.stops.length > 0 && (
                  <ul className="space-y-0.5 text-xs text-muted">
                    {order.stops.map((s, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gold-600" /> {s}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="rounded-btn bg-cream p-2.5 text-sm text-ink">{order.description}</p>
                {order.file_urls.map((u, i) => (
                  <a key={i} href={u.startsWith("demo://") ? undefined : u} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-semibold text-jungle underline">
                    <FileText className="h-4 w-4 text-gold-600" /> View attached file{order.file_urls.length > 1 ? ` ${i + 1}` : ""}
                  </a>
                ))}
                <p className="text-[11px] text-muted">Booked {formatDate(order.created_at)}</p>
              </div>
            </div>

            {!paid && (
              <div className="rounded-card border-2 border-gold bg-gold-100/60 p-4">
                <p className="flex items-center gap-2 font-semibold text-jungle">
                  <Smartphone className="h-4 w-4" /> Complete payment
                </p>
                {order.payment_status === "Awaiting M-Pesa PIN" ? (
                  <p className="mt-1 text-sm">Check your phone and enter your M-Pesa PIN to pay {kes(order.total_price)}.</p>
                ) : (
                  <div className="mt-1 space-y-0.5 text-sm">
                    <p>
                      Pay <b className="text-maroon">{kes(order.total_price)}</b> via M-Pesa → Lipa na M-Pesa →{" "}
                      {paybill ? (
                        <>
                          Paybill <b>{paybill}</b>, Account <b>{shortId(order.id)}</b>
                        </>
                      ) : (
                        <>
                          Buy Goods Till <b>{MANUAL_TILL}</b>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted">We confirm and update this page automatically. Status: {order.payment_status ?? "Pending"}</p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-card border border-line bg-white p-4 shadow-soft">
              <h2 className="mb-3 text-base text-jungle">Progress</h2>
              <ol className="space-y-0">
                {ORDER_STEPS.map((s, i) => {
                  const done = i < stepIndex || order.status === "Delivered";
                  const current = i === stepIndex;
                  return (
                    <li key={s} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                            done ? "border-jungle bg-jungle text-white" : current ? "border-maroon bg-white text-maroon" : "border-line bg-white text-muted"
                          )}
                        >
                          {done ? <Check className="h-4 w-4" /> : i + 1}
                        </span>
                        {i < ORDER_STEPS.length - 1 && <span className={cn("h-6 w-0.5", i < stepIndex ? "bg-jungle" : "bg-line")} />}
                      </div>
                      <div className="pt-0.5">
                        <p className={cn("text-sm font-semibold", done || current ? "text-jungle" : "text-muted")}>{s}</p>
                        {current && order.status !== "Delivered" && <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[11px] font-semibold text-jungle">Current</span>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {order.agent_phone && (
              <div className="rounded-card border border-line bg-white p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your rider</p>
                <p className="mt-1 font-heading text-lg font-bold text-jungle">{order.agent_name ?? "Mtaani Agent"}</p>
                <a href={`tel:${order.agent_phone}`} className="flex items-center gap-1 text-sm text-ink">
                  <Phone className="h-4 w-4 text-gold-600" /> {order.agent_phone}
                </a>
                <Button asChild variant="whatsapp" className="mt-3 w-full">
                  <a href={waLink(`Hi ${order.agent_name ?? ""}, about my Mtaani Errands order #${shortId(order.id)} (${order.from_location} → ${order.to_location})`, order.agent_phone)} target="_blank" rel="noreferrer">
                    <MessageCircle /> WhatsApp rider
                  </a>
                </Button>
              </div>
            )}

            <RiderMap lat={order.rider_lat} lng={order.rider_lng} updatedAt={order.rider_updated_at} status={order.status} />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

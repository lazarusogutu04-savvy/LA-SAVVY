"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, FileText, Loader2, MapPin, Navigation, Phone, Square } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { demoRiderTokenOk, getOrder, updateOrder } from "@/lib/data";
import { demoMode } from "@/lib/supabase";
import type { Order } from "@/lib/types";
import { formatDate, shortId } from "@/lib/utils";

type Job = Pick<Order, "id" | "from_location" | "to_location" | "stops" | "description" | "file_urls" | "customer_name" | "customer_phone" | "is_instant" | "status" | "agent_name">;

/** Send GPS at most every 15 s (or sooner after moving 50 m) — keeps database writes and data use low. */
const MIN_INTERVAL_MS = 15_000;
const MIN_MOVE_M = 50;

function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function RiderInner({ id }: { id: string }) {
  const token = useSearchParams().get("t") ?? "";
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const last = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  const send = useCallback(
    async (patch: { lat?: number; lng?: number; status?: string }) => {
      if (demoMode) {
        if (!demoRiderTokenOk(id, token)) throw new Error("Invalid rider link");
        await updateOrder(id, {
          ...(patch.lat !== undefined ? { rider_lat: patch.lat, rider_lng: patch.lng, rider_updated_at: new Date().toISOString() } : {}),
          ...(patch.status ? { status: patch.status as Order["status"] } : {}),
        });
        return;
      }
      const r = await fetch("/api/rider", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: id, token, ...patch }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error ?? "Update failed");
    },
    [id, token]
  );

  useEffect(() => {
    (async () => {
      try {
        if (demoMode) {
          if (!demoRiderTokenOk(id, token)) throw new Error("Invalid rider link");
          setJob(await getOrder(id));
        } else {
          const r = await fetch(`/api/rider?order=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`);
          const j = await r.json();
          if (!j.ok) throw new Error(j.error);
          setJob(j.order);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [id, token]);

  const stop = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    wakeLock.current?.release().catch(() => undefined);
    wakeLock.current = null;
    setSharing(false);
  }, []);
  useEffect(() => stop, [stop]);

  async function start() {
    setGpsError(null);
    if (!("geolocation" in navigator)) return setGpsError("This phone doesn't support GPS in the browser");
    try {
      // Keep the screen on while delivering so the browser keeps sending GPS.
      const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
      wakeLock.current = (await nav.wakeLock?.request("screen")) ?? null;
    } catch {
      /* optional */
    }
    if (job?.status === "Assigned") {
      await send({ status: "In Transit" }).catch((e) => setGpsError(e.message));
      setJob((j) => (j ? { ...j, status: "In Transit" } : j));
    }
    setSharing(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const now = Date.now();
        const prev = last.current;
        if (prev && now - prev.at < MIN_INTERVAL_MS && metres(prev, p) < MIN_MOVE_M) return;
        last.current = { ...p, at: now };
        send(p)
          .then(() => setLastSent(new Date().toISOString()))
          .catch((e) => setGpsError(e.message));
      },
      (err) => {
        setGpsError(err.code === err.PERMISSION_DENIED ? "Allow location access for this site in your browser settings" : err.message);
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 }
    );
  }

  async function delivered() {
    try {
      await send({ status: "Delivered" });
      stop();
      setJob((j) => (j ? { ...j, status: "Delivered" } : j));
    } catch (e) {
      setGpsError((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-jungle px-4 py-3 text-white">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <LogoMark size={36} />
          <div>
            <p className="font-heading text-sm font-bold text-gold">LA &amp; SAVVY • Rider</p>
            <p className="text-[11px] text-white/80">Share your live location with the customer</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-md space-y-4 px-4 py-5">
        {error && <p className="rounded-card border border-maroon bg-maroon-50 p-4 text-sm font-semibold text-maroon">{error}</p>}
        {!job && !error && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-jungle" />}
        {job && (
          <>
            <div className="space-y-2 rounded-card border border-line bg-white p-4 shadow-soft">
              <p className="text-xs text-muted">
                Order #{shortId(job.id)} • {job.is_instant ? "INSTANT" : "Scheduled"} • <b className="text-jungle">{job.status}</b>
              </p>
              <p className="font-semibold text-jungle">
                {job.from_location} → {job.to_location}
              </p>
              {job.stops.map((s, i) => (
                <p key={i} className="flex items-center gap-1 text-xs text-muted">
                  <MapPin className="h-3 w-3 text-gold-600" /> Stop {i + 1}: {s}
                </p>
              ))}
              <p className="rounded-btn bg-cream p-2.5 text-sm">{job.description}</p>
              {job.file_urls.map((u, i) => (
                <a key={i} href={u} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-semibold text-jungle underline">
                  <FileText className="h-4 w-4 text-gold-600" /> View attached file {job.file_urls.length > 1 ? i + 1 : ""}
                </a>
              ))}
              {job.customer_phone && (
                <a href={`tel:${job.customer_phone}`} className="flex items-center gap-1 text-sm">
                  <Phone className="h-4 w-4 text-gold-600" /> {job.customer_name ?? "Customer"} • {job.customer_phone}
                </a>
              )}
            </div>

            {job.status === "Delivered" ? (
              <div className="rounded-card border border-line bg-white p-5 text-center shadow-soft">
                <CheckCircle2 className="mx-auto h-10 w-10 text-[#2E9D4F]" />
                <p className="mt-2 font-semibold text-jungle">Delivered — asante!</p>
              </div>
            ) : (
              <div className="space-y-3 rounded-card border border-line bg-white p-4 shadow-soft">
                {sharing ? (
                  <>
                    <p className="flex items-center gap-2 text-sm font-semibold text-[#2E9D4F]">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2E9D4F]" /> Sharing live location
                    </p>
                    <p className="text-xs text-muted">Last sent: {lastSent ? formatDate(lastSent) : "waiting for GPS…"} • Keep this page open with the screen on.</p>
                    <Button variant="outline" className="w-full" onClick={stop}>
                      <Square /> Pause sharing
                    </Button>
                  </>
                ) : (
                  <Button size="lg" variant="jungle" className="w-full" onClick={start}>
                    <Navigation /> {job.status === "Assigned" ? "Start trip & share location" : "Share live location"}
                  </Button>
                )}
                <Button size="lg" className="w-full" onClick={delivered}>
                  <CheckCircle2 /> Mark Delivered
                </Button>
                {gpsError && <p className="text-sm font-medium text-maroon">{gpsError}</p>}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function RiderPage({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <RiderInner id={params.id} />
    </Suspense>
  );
}

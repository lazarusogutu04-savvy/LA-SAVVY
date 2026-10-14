"use client";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { mapsConfigured } from "@/lib/config";
import { loadGoogleMaps } from "@/lib/maps";
import { formatDate } from "@/lib/utils";

/**
 * Live rider position. With the Google Maps key: one map load per page view, and the marker
 * moves on each realtime update (no extra API calls). Without it: free OpenStreetMap embed.
 */
export function RiderMap({ lat, lng, updatedAt, status }: { lat: number | null; lng: number | null; updatedAt: string | null; status: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.Marker | null>(null);
  const [googleFailed, setGoogleFailed] = useState(!mapsConfigured);
  const has = lat !== null && lng !== null;
  const useGoogle = has && !googleFailed;

  useEffect(() => {
    if (!useGoogle) return;
    const pos = { lat: lat!, lng: lng! };
    if (map.current && marker.current) {
      marker.current.setPosition(pos);
      map.current.panTo(pos);
      return;
    }
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !el.current) return;
        map.current = new g.maps.Map(el.current, { center: pos, zoom: 15, disableDefaultUI: true, zoomControl: true });
        marker.current = new g.maps.Marker({
          position: pos,
          map: map.current,
          title: "Your rider",
          icon: { path: g.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#7A1C1C", fillOpacity: 1, strokeColor: "#C4A77D", strokeWeight: 3 },
        });
      })
      .catch(() => setGoogleFailed(true));
    return () => {
      cancelled = true;
    };
  }, [useGoogle, lat, lng]);

  if (!has)
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-card border border-dashed border-gold bg-mint px-4 text-center">
        <MapPin className="h-7 w-7 text-maroon" />
        <p className="mt-1 text-sm font-semibold text-jungle">
          {status === "Delivered" ? "Delivered" : status === "Pending" ? "Rider location will show here once your errand is assigned" : "Waiting for the rider to start sharing location…"}
        </p>
        <p className="text-xs text-muted">Updates automatically — no refresh needed</p>
      </div>
    );

  const d = 0.008;
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${lng! - d},${lat! - d},${lng! + d},${lat! + d}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
      <div className="flex items-center justify-between px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-semibold text-jungle">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-maroon" /> Rider live location
        </p>
        <p className="text-[11px] text-muted">Updated {formatDate(updatedAt)}</p>
      </div>
      {useGoogle ? (
        <div ref={el} className="h-56 w-full bg-mint" aria-label="Rider location map" />
      ) : (
        <iframe key={`${lat},${lng}`} title="Rider location map" src={osm} className="h-56 w-full border-0" loading="lazy" />
      )}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-1 border-t border-line py-2 text-xs font-semibold text-jungle"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Open in Google Maps
      </a>
    </div>
  );
}

"use client";
import { GOOGLE_MAPS_API_KEY, mapsConfigured } from "./config";

let loader: Promise<typeof google> | null = null;

/** Loads the Google Maps JavaScript API (places library) once. Rejects when no key is configured. */
export function loadGoogleMaps(): Promise<typeof google> {
  if (!mapsConfigured) return Promise.reject(new Error("Google Maps key will be provided later"));
  if (typeof window !== "undefined" && window.google?.maps?.places) return Promise.resolve(window.google);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const cb = "__mtaaniMapsReady";
    (window as unknown as Record<string, () => void>)[cb] = () => resolve(window.google);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY!)}&libraries=places&region=KE&callback=${cb}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      loader = null;
      reject(new Error("Could not load Google Maps"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

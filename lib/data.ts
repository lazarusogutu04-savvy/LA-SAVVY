"use client";
/**
 * Data layer. Uses Supabase (Postgres + Storage + Realtime) when keys are configured, and a
 * localStorage demo store otherwise, so every screen works before the keys are provided.
 * Security lives in Supabase Row Level Security (see supabase/schema.sql).
 */
import { STORAGE_BUCKET } from "./config";
import { DEFAULT_PRICING } from "./pricing";
import { supabase } from "./supabase";
import type { Agent, Competitor, NewOrder, Order, PaymentConfig, PricingConfig, QuoteRequest } from "./types";

// ── Demo store ───────────────────────────────────────────────────────────────
const EVT = "mtaani-store";
const K = {
  orders: "mtaani.orders",
  agents: "mtaani.agents",
  payment: "mtaani.payment_config",
  pricing: "mtaani.pricing_config",
  competitors: "mtaani.competitors",
  quotes: "mtaani.quote_requests",
  riderTokens: "mtaani.rider_tokens",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — demo only */
  }
  window.dispatchEvent(new Event(EVT));
}
function onDemoChange(cb: () => void) {
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}
const uuid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ── Defaults ─────────────────────────────────────────────────────────────────
export const DEFAULT_PAYMENT: PaymentConfig = {
  id: 1,
  mpesa_stk_enabled: true,
  mpesa_stk_key: null,
  paybill_enabled: false,
  paybill_number: null,
  paypal_enabled: false,
  paypal_id: null,
  card_enabled: false,
  card_key: null,
  last_saved: null,
};

export const DEFAULT_COMPETITORS: Competitor[] = [
  { name: "Glovo", min: 350, max: 450 },
  { name: "Uber Connect", min: 380, max: 480 },
  { name: "Bolt", min: 250, max: 350 },
];

function normalizeOrder(o: Partial<Order> & { id: string }): Order {
  return {
    category: null,
    distance_km: 0,
    duration_min: 0,
    traffic_level: null,
    description: "",
    file_url: null,
    customer_name: null,
    customer_phone: null,
    is_instant: false,
    total_price: 0,
    payment_method: null,
    status: "Pending",
    payment_status: "Pending",
    agent_name: null,
    agent_phone: null,
    zone: null,
    rider_lat: null,
    rider_lng: null,
    rider_updated_at: null,
    created_at: new Date().toISOString(),
    from_location: "",
    to_location: "",
    ...o,
    stops: Array.isArray(o.stops) ? o.stops : [],
    file_urls: Array.isArray(o.file_urls) ? o.file_urls : o.file_url ? [o.file_url] : [],
  } as Order;
}

// ── Orders ───────────────────────────────────────────────────────────────────
export async function createOrder(input: NewOrder): Promise<Order> {
  if (supabase) {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("orders")
      .insert({ ...input, user_id: u.user?.id ?? null })
      .select()
      .single();
    fail(error);
    return normalizeOrder(data as Order);
  }
  const order = normalizeOrder({ ...input, id: uuid(), created_at: new Date().toISOString(), status: "Pending" });
  write(K.orders, [order, ...read<Order[]>(K.orders, [])]);
  return order;
}

export async function getOrder(id: string): Promise<Order | null> {
  if (supabase) {
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    fail(error);
    return data ? normalizeOrder(data as Order) : null;
  }
  const o = read<Order[]>(K.orders, []).find((x) => x.id === id);
  return o ? normalizeOrder(o) : null;
}

/** Live updates for one order (Supabase Realtime postgres_changes UPDATE on orders id=eq.id). */
export function subscribeOrder(id: string, cb: (o: Order) => void): () => void {
  if (supabase) {
    const client = supabase;
    const channel = client
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, (payload) =>
        cb(normalizeOrder(payload.new as Order))
      )
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }
  return onDemoChange(() => {
    const o = read<Order[]>(K.orders, []).find((x) => x.id === id);
    if (o) cb(normalizeOrder(o));
  });
}

/** Orders for the signed-in customer (RLS limits Supabase results to their own). */
export async function listMyOrders(phone: string | null): Promise<Order[]> {
  if (supabase) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [];
    const { data, error } = await supabase.from("orders").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(50);
    fail(error);
    return (data ?? []).map((o) => normalizeOrder(o as Order));
  }
  return read<Order[]>(K.orders, [])
    .filter((o) => !phone || o.customer_phone === phone)
    .map(normalizeOrder);
}

export async function listOrders(opts: { zone?: string | null; limit?: number } = {}): Promise<Order[]> {
  const limit = opts.limit ?? 20;
  if (supabase) {
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(limit);
    if (opts.zone) q = q.eq("zone", opts.zone);
    const { data, error } = await q;
    fail(error);
    return (data ?? []).map((o) => normalizeOrder(o as Order));
  }
  return read<Order[]>(K.orders, [])
    .filter((o) => !opts.zone || o.zone === opts.zone)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(normalizeOrder);
}

export async function countOrders(zone?: string | null) {
  if (supabase) {
    const count = async (status?: string) => {
      let q = supabase!.from("orders").select("id", { count: "exact", head: true });
      if (zone) q = q.eq("zone", zone);
      if (status) q = q.eq("status", status);
      const { count: c, error } = await q;
      fail(error);
      return c ?? 0;
    };
    const [total, pending, delivered] = await Promise.all([count(), count("Pending"), count("Delivered")]);
    return { total, pending, delivered };
  }
  const all = read<Order[]>(K.orders, []).filter((o) => !zone || o.zone === zone);
  return { total: all.length, pending: all.filter((o) => o.status === "Pending").length, delivered: all.filter((o) => o.status === "Delivered").length };
}

export async function updateOrder(id: string, patch: Partial<Order>) {
  if (supabase) {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    fail(error);
    return;
  }
  write(
    K.orders,
    read<Order[]>(K.orders, []).map((o) => (o.id === id ? { ...o, ...patch } : o))
  );
}

/** Live updates for the admin orders table (any insert/update). */
export function subscribeOrders(cb: () => void): () => void {
  if (supabase) {
    const client = supabase;
    const channel = client
      .channel("orders-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => cb())
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }
  return onDemoChange(cb);
}

// ── Rider links (GPS sharing) ────────────────────────────────────────────────
/**
 * Each assigned order gets a secret rider token. The rider opens /rider/{id}?t={token}
 * (sent over WhatsApp) to share live GPS — no login needed. Tokens live in rider_tokens,
 * readable by admins only, so customers can't fake the rider's position.
 */
export async function ensureRiderTokens(orderIds: string[]): Promise<Record<string, string>> {
  if (!orderIds.length) return {};
  if (supabase) {
    const { data, error } = await supabase.from("rider_tokens").select("order_id,token").in("order_id", orderIds);
    fail(error);
    const map: Record<string, string> = Object.fromEntries((data ?? []).map((r) => [r.order_id, r.token]));
    const missing = orderIds.filter((id) => !map[id]);
    if (missing.length) {
      const { data: created, error: e2 } = await supabase
        .from("rider_tokens")
        .upsert(missing.map((order_id) => ({ order_id })), { onConflict: "order_id", ignoreDuplicates: true })
        .select("order_id,token");
      fail(e2);
      (created ?? []).forEach((r) => (map[r.order_id] = r.token));
    }
    return map;
  }
  const all = read<Record<string, string>>(K.riderTokens, {});
  let changed = false;
  orderIds.forEach((id) => {
    if (!all[id]) {
      all[id] = uuid().replace(/-/g, "");
      changed = true;
    }
  });
  if (changed) write(K.riderTokens, all);
  return Object.fromEntries(orderIds.map((id) => [id, all[id]]));
}

export const riderLink = (origin: string, orderId: string, token: string) => `${origin}/rider/${orderId}?t=${token}`;

/** Demo mode only: validates the rider token stored in this browser. */
export function demoRiderTokenOk(orderId: string, token: string) {
  return read<Record<string, string>>(K.riderTokens, {})[orderId] === token;
}

// ── Files (Supabase Storage bucket mtaani-files, path orders/{Date.now()}-{filename}) ─────
export async function uploadOrderFile(file: File): Promise<string> {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `orders/${Date.now()}-${safe}`;
  if (supabase) {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    fail(error);
    return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  }
  // Demo: keep small files as data URLs so "View attached file" still opens something.
  if (file.size <= 700 * 1024) {
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }
  return `demo://${path}`;
}

// ── Agents ───────────────────────────────────────────────────────────────────
export async function listAgents(zone?: string | null): Promise<Agent[]> {
  if (supabase) {
    let q = supabase.from("agents").select("*").order("created_at", { ascending: false });
    if (zone) q = q.eq("zone", zone);
    const { data, error } = await q;
    fail(error);
    return (data ?? []) as Agent[];
  }
  return read<Agent[]>(K.agents, []).filter((a) => !zone || a.zone === zone);
}

export async function addAgent(a: Omit<Agent, "id" | "created_at">): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("agents").insert(a);
    fail(error);
    return;
  }
  write(K.agents, [{ ...a, id: uuid(), created_at: new Date().toISOString() }, ...read<Agent[]>(K.agents, [])]);
}

export async function updateAgent(id: string, patch: Partial<Agent>) {
  if (supabase) {
    const { error } = await supabase.from("agents").update(patch).eq("id", id);
    fail(error);
    return;
  }
  write(
    K.agents,
    read<Agent[]>(K.agents, []).map((a) => (a.id === id ? { ...a, ...patch } : a))
  );
}

export async function findAgentForLogin(userId: string, email: string): Promise<Agent | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("agents").select("*").or(`id.eq.${userId},email.ilike.${email}`).limit(1);
  fail(error);
  return (data?.[0] as Agent) ?? null;
}

// ── Config ───────────────────────────────────────────────────────────────────
export async function getPaymentConfig(): Promise<PaymentConfig> {
  if (supabase) {
    const { data } = await supabase.from("payment_config").select("*").eq("id", 1).maybeSingle();
    return { ...DEFAULT_PAYMENT, ...(data ?? {}) };
  }
  return { ...DEFAULT_PAYMENT, ...read<Partial<PaymentConfig>>(K.payment, {}) };
}

export async function savePaymentConfig(c: PaymentConfig): Promise<PaymentConfig> {
  const next = { ...c, id: 1, last_saved: new Date().toISOString() };
  if (supabase) {
    const { error } = await supabase.from("payment_config").upsert(next);
    fail(error);
    return next;
  }
  write(K.payment, next);
  return next;
}

export async function getPricingConfig(): Promise<PricingConfig> {
  if (supabase) {
    const { data } = await supabase.from("pricing_config").select("*").eq("id", 1).maybeSingle();
    return { ...DEFAULT_PRICING, ...(data ?? {}) };
  }
  return { ...DEFAULT_PRICING, ...read<Partial<PricingConfig>>(K.pricing, {}) };
}

export async function savePricingConfig(c: PricingConfig): Promise<PricingConfig> {
  const next = { ...c, id: 1, last_saved: new Date().toISOString() };
  if (supabase) {
    const { error } = await supabase.from("pricing_config").upsert(next);
    fail(error);
    return next;
  }
  write(K.pricing, next);
  return next;
}

/** INTERNAL — Main Admin only (RLS: competitor_benchmarks readable by Main Admin only). */
export async function getCompetitors(): Promise<Competitor[]> {
  if (supabase) {
    const { data } = await supabase.from("competitor_benchmarks").select("name,min,max").order("name");
    return data && data.length ? (data as Competitor[]) : DEFAULT_COMPETITORS;
  }
  return read<Competitor[]>(K.competitors, DEFAULT_COMPETITORS);
}

export async function saveCompetitors(list: Competitor[]) {
  if (supabase) {
    const { error } = await supabase.from("competitor_benchmarks").upsert(list, { onConflict: "name" });
    fail(error);
    return;
  }
  write(K.competitors, list);
}

// ── Savvy Market quotes ──────────────────────────────────────────────────────
export async function createQuoteRequest(q: QuoteRequest) {
  if (supabase) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("quote_requests").insert({ ...q, user_id: u.user?.id ?? null });
    fail(error);
    return;
  }
  write(K.quotes, [{ ...q, id: uuid(), created_at: new Date().toISOString() }, ...read<unknown[]>(K.quotes, [])]);
}

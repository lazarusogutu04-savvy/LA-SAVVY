import "server-only";
import { isSupabaseConfigured } from "./env";
import { serviceClient } from "./supabase";
import { seedAgents, seedOrders, seedQuotes, seedSettings, seedSuppliers } from "./seed";

/**
 * Tiny data layer. Uses Supabase (Postgres) when configured, otherwise an in-memory demo
 * store so the portal works instantly on Vercel before keys are provided.
 * NOTE: demo data resets whenever the serverless instance restarts.
 */
type Row = Record<string, unknown> & { id: string };
type Table = "agents" | "orders" | "suppliers" | "quote_requests";

const g = globalThis as unknown as { __mtaaniMem?: { tables: Record<Table, Row[]>; settings: Record<string, unknown> } };
function mem() {
  if (!g.__mtaaniMem) {
    g.__mtaaniMem = {
      tables: {
        agents: structuredClone(seedAgents) as unknown as Row[],
        orders: structuredClone(seedOrders) as unknown as Row[],
        suppliers: structuredClone(seedSuppliers) as unknown as Row[],
        quote_requests: structuredClone(seedQuotes) as unknown as Row[],
      },
      settings: structuredClone(seedSettings),
    };
  }
  return g.__mtaaniMem;
}

const toSnake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const mapKeys = (o: Record<string, unknown>, f: (k: string) => string) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [f(k), v]));

export const dataMode = () => (isSupabaseConfigured() ? "supabase" : "demo");

export async function list<T>(table: Table, filter?: Record<string, unknown>): Promise<T[]> {
  if (isSupabaseConfigured()) {
    let q = serviceClient().from(table).select("*");
    for (const [k, v] of Object.entries(filter ?? {})) q = q.eq(toSnake(k), v as string);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => mapKeys(r, toCamel) as T);
  }
  const rows = mem().tables[table].filter((r) => Object.entries(filter ?? {}).every(([k, v]) => r[k] === v));
  return structuredClone(rows) as unknown as T[];
}

export async function get<T>(table: Table, id: string): Promise<T | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await serviceClient().from(table).select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? (mapKeys(data, toCamel) as T) : null;
  }
  const r = mem().tables[table].find((x) => x.id === id);
  return r ? (structuredClone(r) as unknown as T) : null;
}

export async function insert<T>(table: Table, row: Record<string, unknown>): Promise<T> {
  if (isSupabaseConfigured()) {
    const { id: _ignored, ...rest } = row;
    const { data, error } = await serviceClient().from(table).insert(mapKeys(rest, toSnake)).select().single();
    if (error) throw error;
    return mapKeys(data, toCamel) as T;
  }
  const full = { createdAt: new Date().toISOString(), ...row, id: (row.id as string) ?? `${table.slice(0, 2)}_${crypto.randomUUID().slice(0, 8)}` } as Row;
  mem().tables[table].unshift(full);
  return structuredClone(full) as unknown as T;
}

export async function update<T>(table: Table, id: string, patch: Record<string, unknown>): Promise<T | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await serviceClient().from(table).update(mapKeys(patch, toSnake)).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data ? (mapKeys(data, toCamel) as T) : null;
  }
  const r = mem().tables[table].find((x) => x.id === id);
  if (!r) return null;
  Object.assign(r, patch);
  return structuredClone(r) as unknown as T;
}

export async function getSetting<T>(key: string): Promise<T> {
  if (isSupabaseConfigured()) {
    const { data, error } = await serviceClient().from("settings").select("value").eq("key", key).maybeSingle();
    if (error) throw error;
    if (data) return data.value as T;
    return structuredClone(seedSettings[key]) as T;
  }
  return structuredClone(mem().settings[key]) as T;
}

export async function setSetting(key: string, value: unknown) {
  if (isSupabaseConfigured()) {
    const { error } = await serviceClient().from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return;
  }
  mem().settings[key] = structuredClone(value);
}

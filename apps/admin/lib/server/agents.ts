import "server-only";
import type { Agent } from "@shared";
import { list } from "./db";

/** Agents without credential hashes — safe to pass to client components. */
export async function listAgents(filter?: Partial<Agent>): Promise<Agent[]> {
  const rows = await list<Agent & { accessCodeHash?: string }>("agents", filter as Record<string, unknown>);
  return rows.map(({ accessCodeHash: _h, ...a }) => a);
}

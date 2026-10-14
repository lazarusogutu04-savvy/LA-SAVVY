"use server";
import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { AGENT_ROLES, ORDER_STATUSES, ZONES, type Agent, type AgentRole, type Order, type OrderStatus, type PaymentConfig, type PricingConfig, type Supplier, type Zone } from "@shared";
import { get, insert, list, setSetting, update } from "@/lib/server/db";
import { hashAccessCode, requireMainAdmin, requireSession } from "@/lib/server/auth";
import type { CompetitorBenchmark, FairCapConfig } from "@/lib/server/fair-cap";
import { savePaymentConfig } from "@/lib/server/payments";
import { sendSupplierReminders } from "@/lib/server/reminders";

/* ---------- Step 1: Payment configuration ---------- */
export async function savePayments(methods: PaymentConfig["methods"]) {
  await requireMainAdmin();
  const saved = await savePaymentConfig(methods, "Main Admin");
  revalidatePath("/admin/payments");
  return saved;
}

/* ---------- Pricing configuration (Main Admin only) ---------- */
const clamp = (n: unknown, min: number, max: number, fallback: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
};

export async function savePricing(input: { pricing: PricingConfig; cap: FairCapConfig; benchmarks: CompetitorBenchmark[] }) {
  await requireMainAdmin();
  const p = input.pricing;
  const pricing: PricingConfig = {
    ...p,
    baseFee: clamp(p.baseFee, 0, 5000, 80),
    perKm: clamp(p.perKm, 0, 500, 12),
    trafficRate: clamp(p.trafficRate, 0, 50, 1),
    roundTo: clamp(p.roundTo, 1, 100, 10),
    scheduled: { ...p.scheduled, trafficFactor: clamp(p.scheduled.trafficFactor, 0, 3, 0.45), urgencyFee: clamp(p.scheduled.urgencyFee, -5000, 5000, -80) },
    instant: { ...p.instant, trafficFactor: clamp(p.instant.trafficFactor, 0, 3, 1), urgencyFee: clamp(p.instant.urgencyFee, -5000, 5000, 0) },
  };
  const cap: FairCapConfig = {
    ethicalMode: true, // client APIs never expose competitors, regardless of this flag
    capEnabled: Boolean(input.cap.capEnabled),
    capFactor: clamp(input.cap.capFactor, 0.5, 1, 0.85),
    benchmarkKm: clamp(input.cap.benchmarkKm, 1, 200, 22),
  };
  const benchmarks = input.benchmarks
    .filter((b) => b.name.trim())
    .slice(0, 10)
    .map((b) => ({ name: b.name.trim().slice(0, 40), minKes: clamp(b.minKes, 0, 100000, 0), maxKes: clamp(b.maxKes, 0, 100000, 0) }));
  await Promise.all([setSetting("pricing_config", pricing), setSetting("fair_cap", cap), setSetting("competitor_benchmarks", benchmarks)]);
  revalidatePath("/admin/pricing");
  return { savedAt: new Date().toISOString() };
}

/* ---------- Step 4: User management ---------- */
export async function addAgent(input: { name: string; phone: string; nationalId: string; role: AgentRole; zone: Zone }) {
  await requireMainAdmin();
  const name = input.name.trim().slice(0, 80);
  const phone = input.phone.replace(/\s/g, "").slice(0, 16);
  const nationalId = input.nationalId.replace(/\D/g, "").slice(0, 10);
  if (name.length < 2) return { error: "Enter the full name" };
  if (!/^\+?\d{9,13}$/.test(phone)) return { error: "Enter a valid phone number, e.g. +254712345678" };
  if (nationalId.length < 6) return { error: "Enter a valid National ID" };
  if (!AGENT_ROLES.includes(input.role) || !ZONES.includes(input.zone)) return { error: "Choose a role and zone" };
  const existing = await list<Agent>("agents");
  if (existing.some((a) => a.phone === phone)) return { error: "An agent with this phone already exists" };

  const agent = await insert<Agent>("agents", { name, phone, nationalId, role: input.role, zone: input.zone, status: "Active", online: false });
  const code = String(randomInt(100000, 1000000));
  await update("agents", agent.id, { accessCodeHash: hashAccessCode(code, agent.id) });
  revalidatePath("/admin/users");
  // Access code is returned once so the Main Admin can share it via WhatsApp; only its hash is stored.
  return { agent, accessCode: code };
}

export async function setAgentStatus(id: string, status: Agent["status"]) {
  await requireMainAdmin();
  await update("agents", id, { status });
  revalidatePath("/admin/users");
}

/* ---------- Orders ---------- */
async function assertOrderInScope(orderId: string) {
  const s = await requireSession();
  const order = await get<Order>("orders", orderId);
  if (!order) throw new Error("Order not found");
  if (s.role !== "main_admin" && order.zone !== s.zone) throw new Error("Outside your zone");
  return { s, order };
}

export async function assignOrder(orderId: string, agentId: string) {
  const { s } = await assertOrderInScope(orderId);
  const agent = await get<Agent>("agents", agentId);
  if (!agent || agent.status !== "Active") return { error: "Agent unavailable" };
  if (s.role !== "main_admin" && agent.zone !== s.zone) return { error: "Agent is outside your zone" };
  const order = await update<Order>("orders", orderId, { agentId, status: "Assigned" });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/users");
  return { order, agent };
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  await assertOrderInScope(orderId);
  if (!ORDER_STATUSES.includes(status)) return;
  await update("orders", orderId, { status });
  revalidatePath("/admin/orders");
}

/* ---------- Suppliers ---------- */
export async function setSupplierVetting(id: string, vettingStatus: Supplier["vettingStatus"], notes: string) {
  await requireMainAdmin();
  await update("suppliers", id, { vettingStatus, notes: notes.slice(0, 2000) });
  revalidatePath("/admin/suppliers");
}

export async function setSupplierDoc(id: string, docName: string, status: Supplier["documents"][number]["status"], expiresOn: string | null) {
  await requireMainAdmin();
  const s = await get<Supplier>("suppliers", id);
  if (!s) return;
  const documents = s.documents.map((d) => (d.name === docName ? { ...d, status, expiresOn: expiresOn || null } : d));
  await update("suppliers", id, { documents });
  revalidatePath("/admin/suppliers");
}

export async function setSupplierMargin(id: string, marginPct: number) {
  await requireMainAdmin();
  await update("suppliers", id, { marginPct: clamp(marginPct, 0, 100, 15) });
  revalidatePath("/admin/suppliers");
}

export async function addSupplier(input: Pick<Supplier, "name" | "category" | "contactName" | "phone" | "email" | "zone">) {
  await requireMainAdmin();
  if (!input.name.trim() || !input.email.includes("@")) return { error: "Name and a valid email are required" };
  await insert("suppliers", {
    ...input,
    vettingStatus: "Pending Review",
    marginPct: 15,
    notes: "",
    lastReminderAt: null,
    documents: ["Certificate of Incorporation", "CR12", "KRA PIN", "Business Permit", "Director ID"].map((name) => ({ name, status: "Pending", expiresOn: null })),
  });
  revalidatePath("/admin/suppliers");
  return {};
}

export async function remindSupplier(id?: string) {
  await requireMainAdmin();
  const sent = await sendSupplierReminders(id);
  revalidatePath("/admin/suppliers");
  return sent;
}

export async function setQuoteStatus(id: string, status: "New" | "Quoted" | "Closed") {
  await requireMainAdmin();
  await update("quote_requests", id, { status });
  revalidatePath("/admin/suppliers");
}

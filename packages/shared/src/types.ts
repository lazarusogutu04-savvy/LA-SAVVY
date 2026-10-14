import type { AGENT_ROLES, ORDER_STATUSES, ZONES } from "./brand";

export type Zone = (typeof ZONES)[number];
export type AgentRole = (typeof AGENT_ROLES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type Tier = "scheduled" | "instant";

export type PaymentMethodKey = "mpesa_stk" | "mpesa_paybill" | "paypal" | "card";

/** Client-safe payment method config. Secrets (API keys) live in server env only. */
export interface PaymentMethodConfig {
  key: PaymentMethodKey;
  label: string;
  fieldLabel: string;
  enabled: boolean;
  /** Public value shown to customers (e.g. paybill number). Empty => "Will be provided later". */
  value: string;
  /** Secret fields (API keys) are stored server-side only and never returned to clients. */
  secret?: boolean;
  /** For secret fields: whether a value has been saved. */
  configured?: boolean;
}

export interface PaymentConfig {
  methods: PaymentMethodConfig[];
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  role: AgentRole;
  zone: Zone;
  status: "Active" | "Inactive";
  online: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  category: string;
  fromLabel: string;
  toLabel: string;
  zone: Zone;
  distanceKm: number;
  tier: Tier;
  totalKes: number;
  paymentMethod: PaymentMethodKey | null;
  status: OrderStatus;
  agentId: string | null;
  createdAt: string;
  toLat?: number;
  toLng?: number;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  zone: Zone;
  vettingStatus: "Pending Review" | "Approved" | "Rejected";
  documents: { name: string; status: "Verified" | "Pending" | "Rejected"; expiresOn: string | null }[];
  marginPct: number;
  notes: string;
  lastReminderAt: string | null;
}

export interface QuoteRequest {
  id: string;
  description: string;
  category: string;
  supplierContact: string;
  customerPhone: string;
  status: "New" | "Quoted" | "Closed";
  createdAt: string;
}

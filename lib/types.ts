export const CATEGORIES = ["Delivery", "Shopping", "Bill Pay", "Pickup", "Tours", "BnB", "Savvy Market"] as const;
export type Category = (typeof CATEGORIES)[number];

export const ZONES = ["Rongai", "Kiserian", "CBD", "Kitengela", "Nairobi Wide"] as const;
export type Zone = (typeof ZONES)[number];

export const AGENT_ROLES = ["Errand Agent", "Delivery Guy", "Supplier"] as const;
export const MAIN_ADMIN_ROLE = "Main Admin";

export const ORDER_STEPS = ["Pending", "Assigned", "In Transit", "Delivered"] as const;
export type OrderStatus = (typeof ORDER_STEPS)[number];

export type TrafficLevel = "low" | "medium" | "high";

export interface Order {
  id: string;
  user_id?: string | null;
  category: string | null;
  from_location: string;
  to_location: string;
  stops: string[];
  distance_km: number;
  duration_min: number;
  traffic_level: TrafficLevel | null;
  description: string;
  file_url: string | null;
  file_urls: string[];
  customer_name: string | null;
  customer_phone: string | null;
  is_instant: boolean;
  total_price: number;
  payment_method: string | null;
  status: OrderStatus;
  payment_status: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  zone: string | null;
  rider_lat: number | null;
  rider_lng: number | null;
  rider_updated_at: string | null;
  created_at: string;
}

export type NewOrder = Omit<Order, "id" | "created_at" | "status" | "agent_name" | "agent_phone" | "user_id" | "rider_lat" | "rider_lng" | "rider_updated_at">;

export interface Agent {
  id: string;
  name: string;
  phone: string;
  national_id: string | null;
  email: string | null;
  role: string;
  zone: string;
  status: "Active" | "Inactive";
  created_at?: string;
}

export interface PaymentConfig {
  id: number;
  mpesa_stk_enabled: boolean;
  mpesa_stk_key: string | null;
  paybill_enabled: boolean;
  paybill_number: string | null;
  paypal_enabled: boolean;
  paypal_id: string | null;
  card_enabled: boolean;
  card_key: string | null;
  last_saved: string | null;
}

export interface PricingConfig {
  id: number;
  base_fee: number;
  per_km: number;
  traffic_multiplier: number;
  stop_fee: number;
  stop_km: number;
  instant_fee: number;
  ethical_mode: boolean;
  last_saved: string | null;
}

export interface Competitor {
  name: string;
  min: number;
  max: number;
}

export interface QuoteRequest {
  description: string;
  category: string;
  supplier_contact: string;
  customer_phone: string | null;
}

export interface AdminSession {
  email: string;
  name: string;
  role: string;
  zone: string | null;
  isMain: boolean;
  demo: boolean;
}

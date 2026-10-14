import "server-only";
import { DEFAULT_PRICING, type Agent, type Order, type PaymentConfig, type QuoteRequest, type Supplier } from "@shared";
import { DEFAULT_BENCHMARKS, DEFAULT_FAIR_CAP } from "./fair-cap";

const now = Date.now();
const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();
const inDays = (d: number) => new Date(now + d * 86_400_000).toISOString().slice(0, 10);

export const seedAgents: Agent[] = [
  { id: "ag_1", name: "Sarah Otieno", phone: "+254712345678", nationalId: "28456123", role: "Errand Agent", zone: "Rongai", status: "Active", online: true, createdAt: iso(60 * 24 * 30) },
  { id: "ag_2", name: "James Kimani", phone: "+254701234567", nationalId: "30112876", role: "Delivery Guy", zone: "CBD", status: "Active", online: false, createdAt: iso(60 * 24 * 21) },
  { id: "ag_3", name: "Lucy Wanjiku", phone: "+254733987654", nationalId: "29873410", role: "Errand Agent", zone: "Kiserian", status: "Active", online: true, createdAt: iso(60 * 24 * 12) },
  { id: "ag_4", name: "Brian Mutua", phone: "+254722556677", nationalId: "31220984", role: "Delivery Guy", zone: "Kitengela", status: "Active", online: true, createdAt: iso(60 * 24 * 5) },
];

export const seedOrders: Order[] = [
  { id: "or_1234", code: "ME-1234", customerName: "Grace Achieng", customerPhone: "+254711000111", category: "Shopping", fromLabel: "Quickmart Rongai", toLabel: "Karen, Nairobi", zone: "Rongai", distanceKm: 12.3, tier: "instant", totalKes: 250, paymentMethod: "mpesa_stk", status: "Pending", agentId: null, createdAt: iso(14), toLat: -1.3197, toLng: 36.7076 },
  { id: "or_1233", code: "ME-1233", customerName: "Peter Njoroge", customerPhone: "+254722111222", category: "Delivery", fromLabel: "CBD • Nairobi", toLabel: "Rongai • Shangrila Villas", zone: "CBD", distanceKm: 22, tier: "scheduled", totalKes: 280, paymentMethod: "mpesa_paybill", status: "Assigned", agentId: "ag_2", createdAt: iso(48), toLat: -1.39641, toLng: 36.75812 },
  { id: "or_1231", code: "ME-1231", customerName: "Mary Wambui", customerPhone: "+254733222333", category: "Bill Pay", fromLabel: "Kiserian Town", toLabel: "Kiserian KPLC Office", zone: "Kiserian", distanceKm: 4.1, tier: "scheduled", totalKes: 140, paymentMethod: "mpesa_stk", status: "In Transit", agentId: "ag_3", createdAt: iso(95), toLat: -1.4256, toLng: 36.6853 },
  { id: "or_1229", code: "ME-1229", customerName: "Daniel Ouma", customerPhone: "+254744333444", category: "Pickup", fromLabel: "Westlands, Nairobi", toLabel: "Rongai Tuskys", zone: "Nairobi Wide", distanceKm: 27.5, tier: "instant", totalKes: 450, paymentMethod: "card", status: "Delivered", agentId: "ag_2", createdAt: iso(60 * 6), toLat: -1.3958, toLng: 36.7442 },
  { id: "or_1227", code: "ME-1227", customerName: "Faith Chebet", customerPhone: "+254755444555", category: "Shopping", fromLabel: "Kitengela Mall", toLabel: "Kitengela EPZ", zone: "Kitengela", distanceKm: 6.4, tier: "scheduled", totalKes: 160, paymentMethod: "mpesa_stk", status: "Delivered", agentId: "ag_4", createdAt: iso(60 * 26), toLat: -1.4747, toLng: 36.9614 },
];

export const seedSuppliers: Supplier[] = [
  {
    id: "su_1", name: "Savanna Trails Safaris", category: "Tours & Safaris", contactName: "Joseph Lekishon", phone: "+254712334881", email: "bookings@savannatrails.example", zone: "Nairobi Wide",
    vettingStatus: "Pending Review", marginPct: 18, notes: "Awaiting KRA PIN verification. Authorization letter missing signature.", lastReminderAt: null,
    documents: [
      { name: "Certificate of Incorporation", status: "Verified", expiresOn: null },
      { name: "CR12", status: "Verified", expiresOn: inDays(120) },
      { name: "KRA PIN", status: "Pending", expiresOn: null },
      { name: "Business Permit", status: "Verified", expiresOn: inDays(12) },
      { name: "Official Authorization Letter", status: "Rejected", expiresOn: null },
      { name: "Director ID", status: "Verified", expiresOn: null },
    ],
  },
  {
    id: "su_2", name: "Rongai Fresh Grocers", category: "Groceries", contactName: "Ann Mumbi", phone: "+254720998877", email: "orders@rongaifresh.example", zone: "Rongai",
    vettingStatus: "Approved", marginPct: 15, notes: "Ethically sourced from local farms in Kajiado.", lastReminderAt: iso(60 * 24 * 3),
    documents: [
      { name: "Business Permit", status: "Verified", expiresOn: inDays(5) },
      { name: "Food Handling Certificate", status: "Verified", expiresOn: inDays(200) },
      { name: "KRA PIN", status: "Verified", expiresOn: null },
    ],
  },
  {
    id: "su_3", name: "Kiserian Hills BnB", category: "BnB", contactName: "Tom Saitoti", phone: "+254711223344", email: "stay@kiserianhills.example", zone: "Kiserian",
    vettingStatus: "Approved", marginPct: 20, notes: "", lastReminderAt: null,
    documents: [
      { name: "Business Permit", status: "Verified", expiresOn: inDays(-3) },
      { name: "Tourism Regulatory Authority Licence", status: "Verified", expiresOn: inDays(60) },
    ],
  },
];

export const seedQuotes: QuoteRequest[] = [
  { id: "qr_1", description: "50 branded tote bags for a church event", category: "Merchandise", supplierContact: "", customerPhone: "+254700112233", status: "New", createdAt: iso(120) },
];

export const seedPaymentConfig: PaymentConfig = {
  updatedAt: null,
  updatedBy: null,
  methods: [
    { key: "mpesa_stk", label: "M-Pesa STK Push", fieldLabel: "Business Shortcode", enabled: true, value: "" },
    { key: "mpesa_paybill", label: "Paybill Number", fieldLabel: "Paybill Number", enabled: true, value: "" },
    { key: "paypal", label: "PayPal", fieldLabel: "PayPal Email", enabled: false, value: "" },
    { key: "card", label: "Card (Visa / Mastercard)", fieldLabel: "Card API Keys", enabled: true, value: "", secret: true, configured: false },
  ],
};

export const seedSettings: Record<string, unknown> = {
  payment_config: seedPaymentConfig,
  payment_secrets: {} as Record<string, string>,
  pricing_config: DEFAULT_PRICING,
  fair_cap: DEFAULT_FAIR_CAP,
  competitor_benchmarks: DEFAULT_BENCHMARKS,
};

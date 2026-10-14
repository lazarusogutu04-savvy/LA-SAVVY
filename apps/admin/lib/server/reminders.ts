import "server-only";
import { company, type Supplier } from "@shared";
import { list, update } from "./db";
import { sendEmail } from "./email";
import { expiringDocs } from "./suppliers";

export async function sendSupplierReminders(onlyId?: string) {
  const suppliers = await list<Supplier>("suppliers");
  const sent: string[] = [];
  for (const s of suppliers) {
    if (onlyId && s.id !== onlyId) continue;
    const docs = expiringDocs(s);
    if (!docs.length) continue;
    const lines = docs.map((d) => `• ${d.name}: ${d.days! < 0 ? `expired ${-d.days!} day(s) ago` : `expires in ${d.days} day(s)`} (${d.expiresOn})`);
    await sendEmail(
      s.email,
      `Action needed: document renewal for ${s.name}`,
      `Hello ${s.contactName},\n\nTo keep ${s.name} active on Savvy Market, please renew:\n${lines.join("\n")}\n\nReply to ${company.email} with the updated documents.\n\n${company.footer}`
    );
    await update("suppliers", s.id, { lastReminderAt: new Date().toISOString() });
    sent.push(s.name);
  }
  return sent;
}

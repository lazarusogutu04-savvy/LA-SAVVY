import "server-only";
import { company } from "@shared";
import { envValue } from "./env";

/** Sends via Resend when RESEND_API_KEY is set; otherwise logs (demo). */
export async function sendEmail(to: string, subject: string, text: string) {
  const key = envValue("RESEND_API_KEY");
  if (!key) {
    console.log(`[email:demo] to=${to} subject=${subject}`);
    return { demo: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: envValue("EMAIL_FROM") ?? `Mtaani Errands <${company.email}>`, to, subject, text }),
  });
  return { demo: false, ok: res.ok };
}

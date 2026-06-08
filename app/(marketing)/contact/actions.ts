"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
// Where contact submissions are delivered. Defaults to the existing
// feedback alias (forwards to the owner's inbox).
const TO = process.env.CONTACT_EMAIL ?? "feedback@proscene.app";

export type ContactResult = { ok?: boolean; error?: string };

const REASON_LABEL: Record<string, string> = {
  demo: "Demo request",
  school: "Student/educator verification",
  general: "Contact",
};

export async function submitContactForm(
  _prev: ContactResult | undefined,
  formData: FormData,
): Promise<ContactResult> {
  // Honeypot: a hidden field real users never see. Bots fill it — silently
  // accept so they get no signal, but send nothing.
  if (((formData.get("company") as string) ?? "").trim()) return { ok: true };

  const name = ((formData.get("name") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim();
  const reasonRaw = ((formData.get("reason") as string) ?? "general").trim();
  const reason = REASON_LABEL[reasonRaw] ? reasonRaw : "general";
  const message = ((formData.get("message") as string) ?? "").trim();

  if (!name || !email || !message) {
    return { error: "Please add your name, email, and a message." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (message.length > 5000) {
    return { error: "That message is a little long — please trim it down." };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `Proscene · ${REASON_LABEL[reason]} — ${name}`,
      text:
        `Reason: ${REASON_LABEL[reason]}\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n\n` +
        `${message}\n`,
    });
    if (error) {
      return { error: "Something went wrong sending that. Email us directly at feedback@proscene.app." };
    }
  } catch {
    return { error: "Something went wrong sending that. Email us directly at feedback@proscene.app." };
  }

  return { ok: true };
}

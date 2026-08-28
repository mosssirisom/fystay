import { Resend } from "resend";

export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/** The address transactional email is sent from once Resend is configured. */
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "FY Stay <onboarding@resend.dev>";

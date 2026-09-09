const TWILIO_VERIFY_BASE = "https://verify.twilio.com/v2";
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Phone verification via Twilio Verify's REST API - a plain fetch client,
 * not the twilio npm SDK, the same "no extra dependency for one small API"
 * approach as the Ticketmaster/Overpass/Open-Meteo integrations in
 * src/lib/localData/. Genuinely needs a paid Twilio account (unlike those
 * three), so it's inactive without TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 * and TWILIO_VERIFY_SERVICE_SID all set - see isPhoneVerificationConfigured,
 * checked by both the API routes and the /account page before this is ever
 * called, the same "plumbing, inactive without key" pattern as
 * TICKETMASTER_API_KEY.
 */
function twilioCredentials(): { accountSid: string; authToken: string; serviceSid: string } | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) return null;
  return { accountSid, authToken, serviceSid };
}

export function isPhoneVerificationConfigured(): boolean {
  return twilioCredentials() !== null;
}

function basicAuthHeader(accountSid: string, authToken: string): string {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

/**
 * A pragmatic E.164 check (leading +, 8-15 digits) - loose enough not to
 * reject real international numbers, strict enough to fail fast on an
 * obviously wrong value before spending a real Twilio API call on it.
 * Twilio itself is still the actual authority on deliverability.
 */
export function isValidE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export async function sendVerificationCode(phone: string): Promise<void> {
  const creds = twilioCredentials();
  if (!creds) {
    throw new Error("Phone verification is not configured");
  }

  const response = await fetch(
    `${TWILIO_VERIFY_BASE}/Services/${creds.serviceSid}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(creds.accountSid, creds.authToken),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, Channel: "sms" }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Could not send verification code");
  }
}

export async function checkVerificationCode(phone: string, code: string): Promise<boolean> {
  const creds = twilioCredentials();
  if (!creds) {
    throw new Error("Phone verification is not configured");
  }

  const response = await fetch(
    `${TWILIO_VERIFY_BASE}/Services/${creds.serviceSid}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(creds.accountSid, creds.authToken),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, Code: code }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) return false;
  const data = await response.json();
  return data.status === "approved";
}

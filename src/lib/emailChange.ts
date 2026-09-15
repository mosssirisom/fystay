import { randomBytes, createHash } from "crypto";

export const EMAIL_CHANGE_TOKEN_TTL_MINUTES = 60;

export function hashEmailChangeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateEmailChangeToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashEmailChangeToken(token),
    expiresAt: new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MINUTES * 60 * 1000),
  };
}

export type EmailChangeTokenRecord = {
  expiresAt: Date;
  usedAt: Date | null;
};

/** A confirmation link is only good once, and only within its expiry window - same rule as PasswordResetToken. */
export function isEmailChangeTokenValid(record: EmailChangeTokenRecord, now: Date = new Date()): boolean {
  return !record.usedAt && record.expiresAt > now;
}

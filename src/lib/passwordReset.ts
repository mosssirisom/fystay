import { randomBytes, createHash } from "crypto";

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000),
  };
}

export type ResetTokenRecord = {
  expiresAt: Date;
  usedAt: Date | null;
};

/** A reset link is only good once, and only within its expiry window. */
export function isResetTokenValid(record: ResetTokenRecord, now: Date = new Date()): boolean {
  return !record.usedAt && record.expiresAt > now;
}

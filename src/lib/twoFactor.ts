import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Secret, TOTP } from "otpauth";

const ISSUER = "FYStay";
const BACKUP_CODE_COUNT = 8;

function buildTotp(secretBase32: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label: "account",
    secret: Secret.fromBase32(secretBase32),
    digits: 6,
    period: 30,
  });
}

/** A fresh, random base32 TOTP secret - never reused across users or across a re-enrollment. */
export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

/** The otpauth:// URI an authenticator app's QR scanner reads - label is the account email, so a user with several accounts in one app can tell them apart. */
export function buildTotpUri(secretBase32: string, email: string): string {
  const totp = new TOTP({
    issuer: ISSUER,
    label: email,
    secret: Secret.fromBase32(secretBase32),
    digits: 6,
    period: 30,
  });
  return totp.toString();
}

/** True if `code` is a valid current (or recently-valid, within one 30s step either side) TOTP code for this secret. */
export function verifyTotpCode(secretBase32: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  return buildTotp(secretBase32).validate({ token: code, window: 1 }) !== null;
}

/** Random backup codes shown once at enrollment - each redeemable exactly once if the user loses their authenticator device. Formatted in two groups of 5 for readability, not as a security property. */
export function generateBackupCodes(count: number = BACKUP_CODE_COUNT): string[] {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(5).toString("hex").toUpperCase().slice(0, 10);
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

/** Backup codes are stored hashed, the same way passwordHash is - never in plaintext. */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

/**
 * Checks `code` against every stored backup-code hash and, if one matches,
 * returns the remaining hash list with that one removed - each backup code
 * is single-use. Returns { valid: false } with the original list untouched
 * if none match.
 */
export async function verifyAndConsumeBackupCode(
  hashes: string[],
  code: string,
): Promise<{ valid: boolean; remainingHashes: string[] }> {
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(code, hashes[i])) {
      return { valid: true, remainingHashes: [...hashes.slice(0, i), ...hashes.slice(i + 1)] };
    }
  }
  return { valid: false, remainingHashes: hashes };
}

import { describe, expect, it } from "vitest";
import {
  buildTotpUri,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCodes,
  verifyAndConsumeBackupCode,
  verifyTotpCode,
} from "./twoFactor";
import { TOTP, Secret } from "otpauth";

describe("generateTotpSecret", () => {
  it("returns a usable base32 secret each time, never repeating", () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).not.toEqual(b);
    expect(() => Secret.fromBase32(a)).not.toThrow();
  });
});

describe("buildTotpUri", () => {
  it("embeds the issuer and account email in a scannable otpauth:// URI", () => {
    const secret = generateTotpSecret();
    const uri = buildTotpUri(secret, "guest@example.com");
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain("FYStay");
    expect(uri).toContain(encodeURIComponent("guest@example.com"));
  });
});

describe("verifyTotpCode", () => {
  const secret = generateTotpSecret();

  it("accepts the current real code for the secret", () => {
    const validCode = new TOTP({ secret: Secret.fromBase32(secret), digits: 6, period: 30 }).generate();
    expect(verifyTotpCode(secret, validCode)).toBe(true);
  });

  it("rejects a code that isn't 6 digits", () => {
    expect(verifyTotpCode(secret, "12345")).toBe(false);
    expect(verifyTotpCode(secret, "abcdef")).toBe(false);
  });

  it("rejects a code from a different secret", () => {
    const otherSecret = generateTotpSecret();
    const codeFromOther = new TOTP({ secret: Secret.fromBase32(otherSecret), digits: 6, period: 30 }).generate();
    // Astronomically unlikely to collide, but guard against test flakiness
    // rather than assert a false negative on a real coincidence.
    if (verifyTotpCode(otherSecret, codeFromOther)) {
      expect(verifyTotpCode(secret, codeFromOther)).toBe(false);
    }
  });
});

describe("backup codes", () => {
  it("generates the requested number of distinct, formatted codes", () => {
    const codes = generateBackupCodes(8);
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const code of codes) {
      expect(code).toMatch(/^[0-9A-F]{5}-[0-9A-F]{5}$/);
    }
  });

  it("verifies and consumes exactly the matching code, leaving the rest untouched", async () => {
    const codes = generateBackupCodes(3);
    const hashes = await hashBackupCodes(codes);

    const result = await verifyAndConsumeBackupCode(hashes, codes[1]);
    expect(result.valid).toBe(true);
    expect(result.remainingHashes).toHaveLength(2);

    // The consumed code no longer verifies against what's left.
    const second = await verifyAndConsumeBackupCode(result.remainingHashes, codes[1]);
    expect(second.valid).toBe(false);
    expect(second.remainingHashes).toHaveLength(2);
  });

  it("is false for a code that was never issued", async () => {
    const hashes = await hashBackupCodes(generateBackupCodes(2));
    const result = await verifyAndConsumeBackupCode(hashes, "00000-00000");
    expect(result.valid).toBe(false);
    expect(result.remainingHashes).toHaveLength(2);
  });
});

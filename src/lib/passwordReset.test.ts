import { describe, expect, it } from "vitest";
import { generateResetToken, hashResetToken, isResetTokenValid } from "./passwordReset";

const now = new Date("2026-06-15T12:00:00Z");

describe("generateResetToken", () => {
  it("produces a token whose hash matches hashResetToken", () => {
    const { token, tokenHash } = generateResetToken();
    expect(hashResetToken(token)).toBe(tokenHash);
  });

  it("produces a different token each time", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.token).not.toBe(b.token);
  });

  it("sets an expiry in the future", () => {
    const { expiresAt } = generateResetToken();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("isResetTokenValid", () => {
  it("allows an unused, unexpired token", () => {
    expect(
      isResetTokenValid({ expiresAt: new Date("2026-06-15T13:00:00Z"), usedAt: null }, now),
    ).toBe(true);
  });

  it("rejects an expired token", () => {
    expect(
      isResetTokenValid({ expiresAt: new Date("2026-06-15T11:00:00Z"), usedAt: null }, now),
    ).toBe(false);
  });

  it("rejects an already-used token", () => {
    expect(
      isResetTokenValid(
        { expiresAt: new Date("2026-06-15T13:00:00Z"), usedAt: new Date("2026-06-15T11:30:00Z") },
        now,
      ),
    ).toBe(false);
  });
});

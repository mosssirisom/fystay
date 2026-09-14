import { describe, expect, it } from "vitest";
import { tripExtraPurchaseError } from "./tripExtras";

const activeOffering = { active: true, providerActive: true };

describe("tripExtraPurchaseError", () => {
  it("allows a purchase against a confirmed booking with no existing extras", () => {
    expect(tripExtraPurchaseError({ status: "CONFIRMED" }, activeOffering, "offering-1", [])).toBeNull();
  });

  it("allows a purchase against a completed booking", () => {
    expect(tripExtraPurchaseError({ status: "COMPLETED" }, activeOffering, "offering-1", [])).toBeNull();
  });

  it("rejects a purchase against a pending (unpaid) booking", () => {
    expect(tripExtraPurchaseError({ status: "PENDING" }, activeOffering, "offering-1", [])).toMatch(
      /confirmed/,
    );
  });

  it("rejects a purchase against a cancelled booking", () => {
    expect(tripExtraPurchaseError({ status: "CANCELLED" }, activeOffering, "offering-1", [])).toMatch(
      /confirmed/,
    );
  });

  it("rejects a purchase of an inactive offering", () => {
    expect(
      tripExtraPurchaseError({ status: "CONFIRMED" }, { active: false, providerActive: true }, "offering-1", []),
    ).toMatch(/isn't available/);
  });

  it("rejects a purchase when the provider itself is inactive", () => {
    expect(
      tripExtraPurchaseError({ status: "CONFIRMED" }, { active: true, providerActive: false }, "offering-1", []),
    ).toMatch(/isn't available/);
  });

  it("rejects buying the same offering twice once the first purchase is paid", () => {
    const existing = [{ offeringId: "offering-1", status: "PAID" }];
    expect(tripExtraPurchaseError({ status: "CONFIRMED" }, activeOffering, "offering-1", existing)).toMatch(
      /already added/,
    );
  });

  it("allows re-purchasing an offering whose earlier purchase was cancelled", () => {
    const existing = [{ offeringId: "offering-1", status: "CANCELLED" }];
    expect(tripExtraPurchaseError({ status: "CONFIRMED" }, activeOffering, "offering-1", existing)).toBeNull();
  });

  it("allows re-purchasing an offering whose earlier purchase was refunded", () => {
    const existing = [{ offeringId: "offering-1", status: "REFUNDED" }];
    expect(tripExtraPurchaseError({ status: "CONFIRMED" }, activeOffering, "offering-1", existing)).toBeNull();
  });

  it("allows buying a different offering even if another is already purchased", () => {
    const existing = [{ offeringId: "offering-2", status: "PAID" }];
    expect(tripExtraPurchaseError({ status: "CONFIRMED" }, activeOffering, "offering-1", existing)).toBeNull();
  });

  it("does not treat a still-unpaid extras purchase (PENDING_PAYMENT) as blocking a retry", () => {
    // A guest who abandoned Stripe checkout for this same extra should be
    // able to try again, not get stuck behind their own unpaid attempt -
    // reusing/superseding that stale row is the API route's job, not this
    // eligibility check's.
    const existing = [{ offeringId: "offering-1", status: "PENDING_PAYMENT" }];
    expect(tripExtraPurchaseError({ status: "CONFIRMED" }, activeOffering, "offering-1", existing)).toBeNull();
  });
});

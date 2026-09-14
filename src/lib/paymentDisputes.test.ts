import { describe, expect, it } from "vitest";
import { evidenceDueByDate, isDisputeActionable, mapStripeDisputeStatus } from "./paymentDisputes";

describe("mapStripeDisputeStatus", () => {
  it("maps every real Stripe dispute status", () => {
    expect(mapStripeDisputeStatus("warning_needs_response")).toBe("WARNING_NEEDS_RESPONSE");
    expect(mapStripeDisputeStatus("warning_under_review")).toBe("WARNING_UNDER_REVIEW");
    expect(mapStripeDisputeStatus("warning_closed")).toBe("WARNING_CLOSED");
    expect(mapStripeDisputeStatus("needs_response")).toBe("NEEDS_RESPONSE");
    expect(mapStripeDisputeStatus("under_review")).toBe("UNDER_REVIEW");
    expect(mapStripeDisputeStatus("won")).toBe("WON");
    expect(mapStripeDisputeStatus("lost")).toBe("LOST");
    expect(mapStripeDisputeStatus("prevented")).toBe("PREVENTED");
  });

  it("falls back to NEEDS_RESPONSE for an unrecognized status rather than throwing", () => {
    expect(mapStripeDisputeStatus("some_future_status")).toBe("NEEDS_RESPONSE");
  });
});

describe("evidenceDueByDate", () => {
  it("converts a Unix timestamp to a Date", () => {
    const result = evidenceDueByDate(1700000000);
    expect(result).toEqual(new Date(1700000000 * 1000));
  });

  it("treats null as no deadline", () => {
    expect(evidenceDueByDate(null)).toBeNull();
  });

  it("treats undefined as no deadline", () => {
    expect(evidenceDueByDate(undefined)).toBeNull();
  });

  it("treats 0 as no deadline, not epoch", () => {
    expect(evidenceDueByDate(0)).toBeNull();
  });
});

describe("isDisputeActionable", () => {
  const deadline = new Date("2026-01-01");

  it("is actionable when needs_response and a deadline exists", () => {
    expect(isDisputeActionable("NEEDS_RESPONSE", deadline)).toBe(true);
    expect(isDisputeActionable("WARNING_NEEDS_RESPONSE", deadline)).toBe(true);
  });

  it("is not actionable without a deadline, even if the status needs a response", () => {
    expect(isDisputeActionable("NEEDS_RESPONSE", null)).toBe(false);
  });

  it("is not actionable once under review, closed, won, lost, or prevented", () => {
    expect(isDisputeActionable("UNDER_REVIEW", deadline)).toBe(false);
    expect(isDisputeActionable("WARNING_UNDER_REVIEW", deadline)).toBe(false);
    expect(isDisputeActionable("WARNING_CLOSED", deadline)).toBe(false);
    expect(isDisputeActionable("WON", deadline)).toBe(false);
    expect(isDisputeActionable("LOST", deadline)).toBe(false);
    expect(isDisputeActionable("PREVENTED", deadline)).toBe(false);
  });
});

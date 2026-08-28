import { describe, expect, it } from "vitest";
import { decideExistingSessionAction } from "./checkoutSession";

describe("decideExistingSessionAction", () => {
  it("reuses a still-open session rather than creating a second one", () => {
    expect(decideExistingSessionAction("open")).toBe("reuse");
  });

  it("treats a completed session as already paid, never issuing a new charge", () => {
    expect(decideExistingSessionAction("complete")).toBe("already_paid");
  });

  it("allows creating a fresh session once the old one expired unpaid", () => {
    expect(decideExistingSessionAction("expired")).toBe("create_new");
  });

  it("falls back to creating a fresh session for a null or unrecognized status", () => {
    expect(decideExistingSessionAction(null)).toBe("create_new");
    expect(decideExistingSessionAction("some_future_status")).toBe("create_new");
  });
});

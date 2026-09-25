import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCheckRateLimit = vi.fn();
vi.mock("@/lib/rateLimit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rateLimit")>("@/lib/rateLimit");
  return {
    ...actual,
    checkRateLimit: (...args: Parameters<typeof actual.checkRateLimit>) => mockCheckRateLimit(...args),
  };
});

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));

const mockAnalyticsEventCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { analyticsEvent: { create: (...args: unknown[]) => mockAnalyticsEventCreate(...args) } },
}));

const { POST } = await import("./route");

function req(body: unknown): Request {
  return new Request("http://localhost:3000/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockCheckRateLimit.mockReset().mockResolvedValue({ allowed: true, remaining: 59, resetAt: new Date() });
  mockAuth.mockReset().mockResolvedValue(null);
  mockAnalyticsEventCreate.mockReset().mockResolvedValue({});
});

describe("POST /api/analytics/events", () => {
  it("accepts a known, legitimately client-originated event name", async () => {
    const res = await POST(req({ name: "ev_exec_cross_sell_impression", surface: "hotel_detail_page" }));
    expect(res.status).toBe(200);
    expect(mockAnalyticsEventCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects an arbitrary/unknown event name from this public, unauthenticated endpoint", async () => {
    const res = await POST(req({ name: "literally_anything_a_client_makes_up" }));
    expect(res.status).toBe(400);
    expect(mockAnalyticsEventCreate).not.toHaveBeenCalled();
  });

  it("rejects 'transfer_added' and 'transfer_booking_completed' even though they're valid AddonAnalyticsEvent names - nothing legitimate ever sends them through this public route (they're written directly server-side once a purchase actually completes), so accepting them here would let anyone forge a fake completed purchase", async () => {
    for (const name of ["transfer_added", "transfer_booking_completed"]) {
      const res = await POST(req({ name }));
      expect(res.status).toBe(400);
    }
    expect(mockAnalyticsEventCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON/missing name with a 400, not a 500", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });
});

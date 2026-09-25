import { describe, expect, it } from "vitest";
import { computeClickSubId, isAllowedDeepLinkUrl } from "./click";

const baseInput = {
  hotelId: "11111111-1111-1111-1111-111111111111",
  checkIn: new Date(2026, 9, 15),
  checkOut: new Date(2026, 9, 17),
  adults: 2,
  children: 0,
  rooms: 1,
  visitorKey: "visitor-abc",
};

describe("computeClickSubId", () => {
  it("is deterministic for identical inputs on the same day", () => {
    const now = new Date(2026, 9, 1, 9, 0, 0);
    const a = computeClickSubId({ ...baseInput, now });
    const b = computeClickSubId({ ...baseInput, now });
    expect(a).toBe(b);
  });

  it("dedupes a same-day refresh/double-click regardless of time of day", () => {
    const morning = computeClickSubId({ ...baseInput, now: new Date(2026, 9, 1, 8, 0, 0) });
    const night = computeClickSubId({ ...baseInput, now: new Date(2026, 9, 1, 23, 59, 0) });
    expect(morning).toBe(night);
  });

  it("produces a different subId on a different calendar day", () => {
    const day1 = computeClickSubId({ ...baseInput, now: new Date(2026, 9, 1, 12, 0, 0) });
    const day2 = computeClickSubId({ ...baseInput, now: new Date(2026, 9, 2, 12, 0, 0) });
    expect(day1).not.toBe(day2);
  });

  it("produces a different subId for a different hotel", () => {
    const now = new Date(2026, 9, 1);
    const a = computeClickSubId({ ...baseInput, now });
    const b = computeClickSubId({ ...baseInput, hotelId: "22222222-2222-2222-2222-222222222222", now });
    expect(a).not.toBe(b);
  });

  it("produces a different subId for different dates/guests", () => {
    const now = new Date(2026, 9, 1);
    const a = computeClickSubId({ ...baseInput, now });
    const b = computeClickSubId({ ...baseInput, adults: 3, now });
    const c = computeClickSubId({
      ...baseInput,
      checkIn: new Date(2026, 9, 20),
      checkOut: new Date(2026, 9, 22),
      now,
    });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it("produces a different subId for a different visitor", () => {
    const now = new Date(2026, 9, 1);
    const a = computeClickSubId({ ...baseInput, visitorKey: "visitor-abc", now });
    const b = computeClickSubId({ ...baseInput, visitorKey: "visitor-xyz", now });
    expect(a).not.toBe(b);
  });

  it("distinguishes different deals (externalRoomId) on the same hotel/dates", () => {
    const now = new Date(2026, 9, 1);
    const a = computeClickSubId({ ...baseInput, externalRoomId: "room:0", now });
    const b = computeClickSubId({ ...baseInput, externalRoomId: "room:1", now });
    const noRoom = computeClickSubId({ ...baseInput, now });
    expect(a).not.toBe(b);
    expect(a).not.toBe(noRoom);
  });

  it("never depends on anything read from a request - same output for equal explicit inputs regardless of call site", () => {
    const now = new Date(2026, 9, 1);
    const first = computeClickSubId({ ...baseInput, now });
    const second = computeClickSubId({
      hotelId: baseInput.hotelId,
      checkIn: baseInput.checkIn,
      checkOut: baseInput.checkOut,
      adults: baseInput.adults,
      children: baseInput.children,
      rooms: baseInput.rooms,
      visitorKey: baseInput.visitorKey,
      now,
    });
    expect(first).toBe(second);
  });
});

describe("isAllowedDeepLinkUrl", () => {
  it("allows the mock provider's own known deep-link host over https", () => {
    expect(isAllowedDeepLinkUrl("mock", "https://mock-hotel-provider.invalid/deeplink/x")).toBe(true);
  });

  it("rejects a mismatched host for the mock provider", () => {
    expect(isAllowedDeepLinkUrl("mock", "https://evil.example.com/deeplink/x")).toBe(false);
  });

  it("rejects plain http even for an otherwise-allowed host", () => {
    expect(isAllowedDeepLinkUrl("mock", "http://mock-hotel-provider.invalid/deeplink/x")).toBe(false);
  });

  it("rejects a provider with no allowlist entry at all (e.g. booking_com today)", () => {
    expect(isAllowedDeepLinkUrl("booking_com", "https://booking.com/hotel/x")).toBe(false);
  });

  it("rejects an unregistered/unknown provider code", () => {
    expect(isAllowedDeepLinkUrl("totally_unknown", "https://mock-hotel-provider.invalid/x")).toBe(false);
  });

  it("rejects a malformed URL rather than throwing", () => {
    expect(isAllowedDeepLinkUrl("mock", "not a url")).toBe(false);
  });

  it("rejects a javascript: or data: pseudo-url", () => {
    expect(isAllowedDeepLinkUrl("mock", "javascript:alert(1)")).toBe(false);
    expect(isAllowedDeepLinkUrl("mock", "data:text/html,<script>1</script>")).toBe(false);
  });
});

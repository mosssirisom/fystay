import { describe, expect, it } from "vitest";
import {
  computeHostResponseStats,
  computeOccupancyRate,
  formatResponseTime,
  hostRevenueCents,
  summarizeEarnings,
} from "./hostStats";

function booking(overrides: Partial<Parameters<typeof hostRevenueCents>[0]> = {}) {
  return {
    nightlyPriceCents: 10000,
    cleaningFeeCents: 2000,
    totalPriceCents: 13200,
    refundedAmountCents: null,
    paymentStatus: "PAID" as const,
    ...overrides,
  };
}

describe("hostRevenueCents", () => {
  it("is 0 for an unpaid booking", () => {
    expect(hostRevenueCents(booking({ paymentStatus: "UNPAID" }))).toBe(0);
  });

  it("excludes the guest service fee from a fully paid, unrefunded booking", () => {
    // nightly 10000 + cleaning 2000 = 12000 host revenue, service fee (1200) excluded
    expect(hostRevenueCents(booking())).toBe(12000);
  });

  it("reduces revenue proportionally for a partial refund", () => {
    // 50% of the 13200 total refunded -> host keeps 50% of their 12000 share
    expect(hostRevenueCents(booking({ paymentStatus: "PARTIALLY_REFUNDED", refundedAmountCents: 6600 }))).toBe(
      6000,
    );
  });

  it("is 0 for a fully refunded booking", () => {
    expect(hostRevenueCents(booking({ paymentStatus: "REFUNDED", refundedAmountCents: 13200 }))).toBe(0);
  });

  it("never goes negative if a refund somehow exceeds the total", () => {
    expect(hostRevenueCents(booking({ paymentStatus: "REFUNDED", refundedAmountCents: 99999 }))).toBe(0);
  });
});

describe("summarizeEarnings", () => {
  const reference = new Date("2026-06-15T00:00:00Z");

  it("buckets a booking checking in this month into both total and thisMonth", () => {
    const summary = summarizeEarnings(
      [{ ...booking(), checkIn: new Date("2026-06-20T00:00:00Z") }],
      reference,
    );
    expect(summary.totalCents).toBe(12000);
    expect(summary.thisMonthCents).toBe(12000);
    expect(summary.upcoming30DaysCents).toBe(12000);
  });

  it("counts a booking from last month toward total only", () => {
    const summary = summarizeEarnings(
      [{ ...booking(), checkIn: new Date("2026-05-10T00:00:00Z") }],
      reference,
    );
    expect(summary.totalCents).toBe(12000);
    expect(summary.thisMonthCents).toBe(0);
    expect(summary.upcoming30DaysCents).toBe(0);
  });

  it("counts a booking 45 days out toward total and thisMonth-adjacent totals but not the 30-day window", () => {
    const summary = summarizeEarnings(
      [{ ...booking(), checkIn: new Date("2026-07-30T00:00:00Z") }],
      reference,
    );
    expect(summary.totalCents).toBe(12000);
    expect(summary.upcoming30DaysCents).toBe(0);
  });

  it("ignores unpaid bookings entirely", () => {
    const summary = summarizeEarnings(
      [{ ...booking({ paymentStatus: "UNPAID" }), checkIn: new Date("2026-06-20T00:00:00Z") }],
      reference,
    );
    expect(summary).toEqual({ totalCents: 0, thisMonthCents: 0, upcoming30DaysCents: 0 });
  });

  it("sums multiple bookings", () => {
    const summary = summarizeEarnings(
      [
        { ...booking(), checkIn: new Date("2026-06-16T00:00:00Z") },
        { ...booking(), checkIn: new Date("2026-06-17T00:00:00Z") },
      ],
      reference,
    );
    expect(summary.totalCents).toBe(24000);
  });
});

describe("computeOccupancyRate", () => {
  const reference = new Date("2026-06-01T00:00:00Z");

  it("is null with no published listings", () => {
    expect(
      computeOccupancyRate({
        listings: [{ id: "l1", published: false }],
        bookings: [],
        referenceDate: reference,
      }),
    ).toBeNull();
  });

  it("is 0 with a published listing and no bookings", () => {
    expect(
      computeOccupancyRate({
        listings: [{ id: "l1", published: true }],
        bookings: [],
        referenceDate: reference,
      }),
    ).toBe(0);
  });

  it("is 100 when a single published listing is booked for the entire window", () => {
    expect(
      computeOccupancyRate({
        listings: [{ id: "l1", published: true }],
        bookings: [
          {
            listingId: "l1",
            checkIn: new Date("2026-06-01T00:00:00Z"),
            checkOut: new Date("2026-07-01T00:00:00Z"),
            status: "CONFIRMED",
          },
        ],
        referenceDate: reference,
        windowDays: 30,
      }),
    ).toBe(100);
  });

  it("ignores a cancelled booking's nights", () => {
    expect(
      computeOccupancyRate({
        listings: [{ id: "l1", published: true }],
        bookings: [
          {
            listingId: "l1",
            checkIn: new Date("2026-06-01T00:00:00Z"),
            checkOut: new Date("2026-07-01T00:00:00Z"),
            status: "CANCELLED",
          },
        ],
        referenceDate: reference,
        windowDays: 30,
      }),
    ).toBe(0);
  });

  it("excludes an unpublished listing from both numerator and denominator", () => {
    const rate = computeOccupancyRate({
      listings: [
        { id: "published", published: true },
        { id: "unpublished", published: false },
      ],
      bookings: [
        {
          listingId: "unpublished",
          checkIn: new Date("2026-06-01T00:00:00Z"),
          checkOut: new Date("2026-07-01T00:00:00Z"),
          status: "CONFIRMED",
        },
      ],
      referenceDate: reference,
      windowDays: 30,
    });
    // The unpublished listing's booking shouldn't count, and the published
    // listing (with no bookings of its own) should be fully empty.
    expect(rate).toBe(0);
  });

  it("averages across multiple published listings with partial bookings", () => {
    const rate = computeOccupancyRate({
      listings: [
        { id: "l1", published: true },
        { id: "l2", published: true },
      ],
      bookings: [
        {
          listingId: "l1",
          checkIn: new Date("2026-06-01T00:00:00Z"),
          checkOut: new Date("2026-07-01T00:00:00Z"),
          status: "CONFIRMED",
        },
      ],
      referenceDate: reference,
      windowDays: 30,
    });
    // l1 fully booked (30 nights), l2 empty -> 30 / 60 = 50%
    expect(rate).toBe(50);
  });

  it("only counts the portion of a booking that overlaps the window", () => {
    const rate = computeOccupancyRate({
      listings: [{ id: "l1", published: true }],
      bookings: [
        {
          listingId: "l1",
          // Starts 5 days before the window and ends 5 days into it.
          checkIn: new Date("2026-05-27T00:00:00Z"),
          checkOut: new Date("2026-06-06T00:00:00Z"),
          status: "COMPLETED",
        },
      ],
      referenceDate: reference,
      windowDays: 30,
    });
    // Only 5 of the 9 booked nights fall inside [Jun 1, Jul 1).
    expect(rate).toBe(Math.round((5 / 30) * 100));
  });
});

const d = (s: string) => new Date(s);
const HOST = "host-1";
const GUEST = "guest-1";

describe("computeHostResponseStats", () => {
  it("returns nulls when there are no conversations", () => {
    expect(computeHostResponseStats([])).toEqual({ responseRate: null, medianResponseMinutes: null });
  });

  it("ignores a conversation the host started themselves", () => {
    const stats = computeHostResponseStats([
      {
        hostId: HOST,
        guestId: GUEST,
        messages: [{ senderId: HOST, createdAt: d("2026-01-01T10:00:00Z") }],
      },
    ]);
    expect(stats).toEqual({ responseRate: null, medianResponseMinutes: null });
  });

  it("counts a guest-initiated conversation the host never replied to against the rate, but not the timing", () => {
    const stats = computeHostResponseStats([
      {
        hostId: HOST,
        guestId: GUEST,
        messages: [{ senderId: GUEST, createdAt: d("2026-01-01T10:00:00Z") }],
      },
    ]);
    expect(stats.responseRate).toBe(0);
    expect(stats.medianResponseMinutes).toBeNull();
  });

  it("computes a 100% rate and the exact response time for a single replied conversation", () => {
    const stats = computeHostResponseStats([
      {
        hostId: HOST,
        guestId: GUEST,
        messages: [
          { senderId: GUEST, createdAt: d("2026-01-01T10:00:00Z") },
          { senderId: HOST, createdAt: d("2026-01-01T10:30:00Z") },
        ],
      },
    ]);
    expect(stats.responseRate).toBe(100);
    expect(stats.medianResponseMinutes).toBe(30);
  });

  it("sorts unordered messages before finding the guest's first message and the host's first reply", () => {
    const stats = computeHostResponseStats([
      {
        hostId: HOST,
        guestId: GUEST,
        messages: [
          { senderId: HOST, createdAt: d("2026-01-01T11:00:00Z") },
          { senderId: GUEST, createdAt: d("2026-01-01T10:00:00Z") },
        ],
      },
    ]);
    expect(stats.responseRate).toBe(100);
    expect(stats.medianResponseMinutes).toBe(60);
  });

  it("mixes replied and unreplied conversations into one rate, timing only from the replied ones", () => {
    const stats = computeHostResponseStats([
      {
        hostId: HOST,
        guestId: GUEST,
        messages: [
          { senderId: GUEST, createdAt: d("2026-01-01T10:00:00Z") },
          { senderId: HOST, createdAt: d("2026-01-01T10:10:00Z") },
        ],
      },
      {
        hostId: HOST,
        guestId: "guest-2",
        messages: [{ senderId: "guest-2", createdAt: d("2026-01-02T10:00:00Z") }],
      },
    ]);
    expect(stats.responseRate).toBe(50);
    expect(stats.medianResponseMinutes).toBe(10);
  });

  it("computes the median across an odd number of response times", () => {
    const stats = computeHostResponseStats([
      { hostId: HOST, guestId: "g1", messages: [
        { senderId: "g1", createdAt: d("2026-01-01T10:00:00Z") },
        { senderId: HOST, createdAt: d("2026-01-01T10:10:00Z") },
      ] },
      { hostId: HOST, guestId: "g2", messages: [
        { senderId: "g2", createdAt: d("2026-01-01T10:00:00Z") },
        { senderId: HOST, createdAt: d("2026-01-01T11:00:00Z") },
      ] },
      { hostId: HOST, guestId: "g3", messages: [
        { senderId: "g3", createdAt: d("2026-01-01T10:00:00Z") },
        { senderId: HOST, createdAt: d("2026-01-01T10:20:00Z") },
      ] },
    ]);
    // Response times: 10, 60, 20 -> sorted 10, 20, 60 -> median 20
    expect(stats.medianResponseMinutes).toBe(20);
  });
});

describe("formatResponseTime", () => {
  it("buckets an hour or less as within an hour", () => {
    expect(formatResponseTime(45)).toBe("within an hour");
    expect(formatResponseTime(60)).toBe("within an hour");
  });

  it("buckets up to six hours as within a few hours", () => {
    expect(formatResponseTime(61)).toBe("within a few hours");
    expect(formatResponseTime(360)).toBe("within a few hours");
  });

  it("buckets up to a day as within a day", () => {
    expect(formatResponseTime(361)).toBe("within a day");
    expect(formatResponseTime(1440)).toBe("within a day");
  });

  it("buckets anything longer as within a few days", () => {
    expect(formatResponseTime(1441)).toBe("within a few days");
  });
});

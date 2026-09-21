import { describe, expect, it } from "vitest";
import {
  ARRIVAL_REMINDER_WINDOW_DAYS,
  REVIEW_REQUEST_DELAY_DAYS,
  TRANSFER_UPSELL_DELAY_DAYS,
  needsArrivalReminder,
  needsReviewRequest,
  needsTransferUpsellEmail,
} from "./bookingLifecycleEmails";

const d = (s: string) => new Date(s);

describe("needsArrivalReminder", () => {
  const base = {
    status: "CONFIRMED",
    paymentStatus: "PAID",
    checkIn: d("2026-06-10T00:00:00Z"),
    arrivalReminderSentAt: null,
  };

  it("is false well before the reminder window opens", () => {
    expect(needsArrivalReminder(base, d("2026-06-01T00:00:00Z"))).toBe(false);
  });

  it("is true right at the start of the window", () => {
    const windowStart = new Date(
      base.checkIn.getTime() - ARRIVAL_REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    expect(needsArrivalReminder(base, windowStart)).toBe(true);
  });

  it("is true right up to check-in", () => {
    expect(needsArrivalReminder(base, base.checkIn)).toBe(true);
  });

  it("is false once check-in has passed", () => {
    expect(needsArrivalReminder(base, d("2026-06-11T00:00:00Z"))).toBe(false);
  });

  it("is false when the booking isn't CONFIRMED", () => {
    expect(needsArrivalReminder({ ...base, status: "PENDING" }, base.checkIn)).toBe(false);
  });

  it("is false when the booking hasn't been paid", () => {
    expect(needsArrivalReminder({ ...base, paymentStatus: "UNPAID" }, base.checkIn)).toBe(false);
  });

  it("is false once a reminder has already been sent", () => {
    expect(
      needsArrivalReminder({ ...base, arrivalReminderSentAt: d("2026-06-08T00:00:00Z") }, base.checkIn),
    ).toBe(false);
  });
});

describe("needsReviewRequest", () => {
  const base = {
    status: "CONFIRMED",
    checkOut: d("2026-06-12T00:00:00Z"),
    review: null,
    reviewRequestSentAt: null,
  };

  it("is false before checkout", () => {
    expect(needsReviewRequest(base, d("2026-06-11T00:00:00Z"))).toBe(false);
  });

  it("is false right at checkout - the delay hasn't elapsed yet", () => {
    expect(needsReviewRequest(base, base.checkOut)).toBe(false);
  });

  it("is true once the delay has elapsed", () => {
    const eligibleFrom = new Date(base.checkOut.getTime() + REVIEW_REQUEST_DELAY_DAYS * 24 * 60 * 60 * 1000);
    expect(needsReviewRequest(base, eligibleFrom)).toBe(true);
  });

  it("is false once a review already exists", () => {
    const eligibleFrom = new Date(base.checkOut.getTime() + REVIEW_REQUEST_DELAY_DAYS * 24 * 60 * 60 * 1000);
    expect(needsReviewRequest({ ...base, review: { rating: 5 } }, eligibleFrom)).toBe(false);
  });

  it("is false once a request has already been sent", () => {
    const eligibleFrom = new Date(base.checkOut.getTime() + REVIEW_REQUEST_DELAY_DAYS * 24 * 60 * 60 * 1000);
    expect(
      needsReviewRequest({ ...base, reviewRequestSentAt: d("2026-06-13T00:00:00Z") }, eligibleFrom),
    ).toBe(false);
  });

  it("is false for a booking that was never confirmed", () => {
    const eligibleFrom = new Date(base.checkOut.getTime() + REVIEW_REQUEST_DELAY_DAYS * 24 * 60 * 60 * 1000);
    expect(needsReviewRequest({ ...base, status: "CANCELLED" }, eligibleFrom)).toBe(false);
  });
});

describe("needsTransferUpsellEmail", () => {
  const base = {
    status: "CONFIRMED",
    paymentStatus: "PAID",
    paidAt: d("2026-06-01T00:00:00Z"),
    transferUpsellEmailSentAt: null,
  };

  it("is false right at payment - the delay hasn't elapsed yet", () => {
    expect(needsTransferUpsellEmail(base, false, base.paidAt)).toBe(false);
  });

  it("is true once the delay has elapsed", () => {
    const eligibleFrom = new Date(base.paidAt.getTime() + TRANSFER_UPSELL_DELAY_DAYS * 24 * 60 * 60 * 1000);
    expect(needsTransferUpsellEmail(base, false, eligibleFrom)).toBe(true);
  });

  it("is false when the guest already has an airport transfer", () => {
    const eligibleFrom = new Date(base.paidAt.getTime() + TRANSFER_UPSELL_DELAY_DAYS * 24 * 60 * 60 * 1000);
    expect(needsTransferUpsellEmail(base, true, eligibleFrom)).toBe(false);
  });

  it("is false once an upsell email has already been sent", () => {
    const eligibleFrom = new Date(base.paidAt.getTime() + TRANSFER_UPSELL_DELAY_DAYS * 24 * 60 * 60 * 1000);
    expect(
      needsTransferUpsellEmail(
        { ...base, transferUpsellEmailSentAt: d("2026-06-02T00:00:00Z") },
        false,
        eligibleFrom,
      ),
    ).toBe(false);
  });

  it("is false when the booking isn't CONFIRMED", () => {
    const eligibleFrom = new Date(base.paidAt.getTime() + TRANSFER_UPSELL_DELAY_DAYS * 24 * 60 * 60 * 1000);
    expect(needsTransferUpsellEmail({ ...base, status: "CANCELLED" }, false, eligibleFrom)).toBe(false);
  });

  it("is false when the booking hasn't been paid", () => {
    const eligibleFrom = new Date(base.paidAt.getTime() + TRANSFER_UPSELL_DELAY_DAYS * 24 * 60 * 60 * 1000);
    expect(
      needsTransferUpsellEmail({ ...base, paymentStatus: "UNPAID" }, false, eligibleFrom),
    ).toBe(false);
  });
});

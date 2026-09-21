import { canReviewBooking, type ReviewableBooking } from "@/lib/reviews";

// Send an arrival reminder once check-in is within this many days out.
export const ARRIVAL_REMINDER_WINDOW_DAYS = 2;
// Wait this long after checkout before asking for a review - long enough
// that a guest has actually gotten home and formed an opinion, not so long
// the stay has gone fuzzy in their memory.
export const REVIEW_REQUEST_DELAY_DAYS = 1;

export type ArrivalReminderBooking = {
  status: string;
  paymentStatus: string;
  checkIn: Date;
  arrivalReminderSentAt: Date | null;
};

/**
 * True once a CONFIRMED, paid booking's check-in has entered the reminder
 * window and no reminder has gone out yet - see the daily cron
 * (/api/cron/booking-lifecycle-emails) that's the only caller. A booking
 * that's already been reminded, or isn't a real upcoming stay at all
 * (unpaid, cancelled), is never eligible again.
 */
export function needsArrivalReminder(booking: ArrivalReminderBooking, now: Date = new Date()): boolean {
  if (booking.status !== "CONFIRMED" || booking.paymentStatus !== "PAID") return false;
  if (booking.arrivalReminderSentAt) return false;
  const windowEnd = new Date(now.getTime() + ARRIVAL_REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return booking.checkIn >= now && booking.checkIn <= windowEnd;
}

// Wait a day after payment before nudging about a transfer - the
// confirmation page (see AirportTransferNudge) already offers this the
// moment the stay is booked, so this email is a catch for a guest who
// skipped that, not a same-day repeat of it.
export const TRANSFER_UPSELL_DELAY_DAYS = 1;

export type TransferUpsellBooking = {
  status: string;
  paymentStatus: string;
  paidAt: Date | null;
  transferUpsellEmailSentAt: Date | null;
};

/**
 * True once a CONFIRMED, paid booking has cleared the delay window, no
 * upsell email has gone out yet, and the guest hasn't already bought an
 * airport transfer for this booking (see item 6 of the cross-sell brief in
 * docs/trip-extras-roadmap.md) - `hasAirportTransfer` is looked up by the
 * caller (the cron route) rather than joined in here, so this stays a pure
 * function of plain booking data like every other "needs" check in this
 * file.
 */
export function needsTransferUpsellEmail(
  booking: TransferUpsellBooking,
  hasAirportTransfer: boolean,
  now: Date = new Date(),
): boolean {
  if (booking.status !== "CONFIRMED" || booking.paymentStatus !== "PAID") return false;
  if (booking.transferUpsellEmailSentAt) return false;
  if (hasAirportTransfer) return false;
  if (!booking.paidAt) return false;
  const eligibleFrom = new Date(booking.paidAt.getTime() + TRANSFER_UPSELL_DELAY_DAYS * 24 * 60 * 60 * 1000);
  return now >= eligibleFrom;
}

export type ReviewRequestBooking = ReviewableBooking & { reviewRequestSentAt: Date | null };

/**
 * True once a stay is eligible for a review (see canReviewBooking) *and*
 * REVIEW_REQUEST_DELAY_DAYS has passed since checkout *and* no request has
 * been sent yet - sent at most once per booking regardless of whether the
 * guest ever actually reviews it.
 */
export function needsReviewRequest(booking: ReviewRequestBooking, now: Date = new Date()): boolean {
  if (booking.reviewRequestSentAt) return false;
  if (!canReviewBooking(booking, now)) return false;
  const eligibleFrom = new Date(booking.checkOut.getTime() + REVIEW_REQUEST_DELAY_DAYS * 24 * 60 * 60 * 1000);
  return now >= eligibleFrom;
}

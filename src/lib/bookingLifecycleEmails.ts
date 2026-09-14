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

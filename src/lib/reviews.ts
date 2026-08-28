export type ReviewableBooking = {
  status: string;
  checkOut: Date;
  review?: unknown | null;
};

/** A guest may review a stay once it's paid for, completed, and not already reviewed. */
export function canReviewBooking(booking: ReviewableBooking, now: Date = new Date()): boolean {
  return booking.status === "CONFIRMED" && booking.checkOut <= now && !booking.review;
}

import type { Booking, Listing, PrismaClient, User } from "@prisma/client";

/**
 * FYStay has no background job runner, so a booking's move from CONFIRMED
 * to COMPLETED happens lazily: whenever a guest's bookings are about to be
 * read, first flip any of theirs whose stay has already ended. Cheap
 * (guestId-scoped, only touches rows that actually need it) and keeps the
 * stored status truthful without a scheduler.
 */
export async function completePastBookings(
  prisma: PrismaClient,
  guestId: string,
  now: Date = new Date(),
): Promise<void> {
  await prisma.booking.updateMany({
    where: { guestId, status: "CONFIRMED", checkOut: { lte: now } },
    data: { status: "COMPLETED" },
  });
}

export type ExpiredBookingRequest = Booking & { listing: Listing & { host: User } };

/**
 * A request-to-book request (see Listing.instantBook) the host never
 * responded to within REQUEST_HOLD_HOURS. Same lazy-cleanup approach as
 * completePastBookings: called whenever a guest's or host's bookings are
 * about to be read (guestId/hostId scope), plus a daily cron sweep with no
 * scope for anyone who doesn't happen to check back (see
 * /api/cron/expire-booking-requests) - this app has no background job
 * runner to fire the moment a deadline actually passes.
 *
 * Any referral credit the guest had spent on the booking (see
 * computeCreditToApply in referral.ts) is refunded back to their balance -
 * unlike an instant-book PENDING booking that simply goes unpaid, this
 * guest did nothing wrong; the host is the one who let the clock run out.
 *
 * Returns the bookings it just expired (with listing/host attached) so a
 * caller that wants to notify the guest - only the cron sweep does today -
 * has what it needs without a second query.
 */
export async function expireStaleBookingRequests(
  prisma: PrismaClient,
  scope: { guestId?: string; hostId?: string } = {},
  now: Date = new Date(),
): Promise<ExpiredBookingRequest[]> {
  const stale = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      approvalStatus: "AWAITING",
      requestExpiresAt: { lte: now },
      ...(scope.guestId && { guestId: scope.guestId }),
      ...(scope.hostId && { listing: { hostId: scope.hostId } }),
    },
    include: { listing: { include: { host: true } } },
  });

  for (const booking of stale) {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED", approvalStatus: "EXPIRED", hostRespondedAt: now },
      }),
      ...(booking.creditAppliedCents > 0
        ? [
            prisma.user.update({
              where: { id: booking.guestId },
              data: { creditBalanceCents: { increment: booking.creditAppliedCents } },
            }),
          ]
        : []),
    ]);
  }

  return stale;
}

import type { PrismaClient } from "@prisma/client";

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

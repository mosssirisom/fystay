import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";
import { blockingBookingWhere, isRangeAvailable } from "@/lib/availability";

const respondSchema = z.object({ action: z.enum(["approve", "decline"]) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const { id, requestId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const changeRequest = await prisma.bookingChangeRequest.findUnique({
    where: { id: requestId },
    include: { booking: { include: { listing: true } } },
  });

  if (!changeRequest || changeRequest.bookingId !== id) {
    return NextResponse.json({ error: "Change request not found" }, { status: 404 });
  }
  if (changeRequest.booking.listing.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (changeRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: "This request has already been responded to" },
      { status: 409 },
    );
  }

  if (parsed.data.action === "decline") {
    const updated = await prisma.bookingChangeRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
    return NextResponse.json({ changeRequest: updated });
  }

  // Approving: re-check availability, since the requested dates may have
  // been booked by someone else in the time since the guest asked.
  const otherBookings = await prisma.booking.findMany({
    where: { listingId: changeRequest.booking.listingId, id: { not: changeRequest.bookingId }, ...blockingBookingWhere() },
    select: { checkIn: true, checkOut: true },
  });
  if (
    !isRangeAvailable(changeRequest.requestedCheckIn, changeRequest.requestedCheckOut, otherBookings)
  ) {
    return NextResponse.json(
      { error: "Those dates are no longer available" },
      { status: 409 },
    );
  }

  if (changeRequest.priceDeltaCents > 0) {
    // The guest owes more; leave the booking untouched until they pay.
    const updated = await prisma.bookingChangeRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", respondedAt: new Date() },
    });
    return NextResponse.json({ changeRequest: updated });
  }

  if (changeRequest.priceDeltaCents < 0) {
    const stripe = getStripeClient();
    if (stripe && changeRequest.booking.stripePaymentIntentId) {
      await stripe.refunds.create({
        payment_intent: changeRequest.booking.stripePaymentIntentId,
        amount: Math.abs(changeRequest.priceDeltaCents),
      });
    }
  }

  const [updatedRequest] = await prisma.$transaction([
    prisma.bookingChangeRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        respondedAt: new Date(),
        refundedAt: changeRequest.priceDeltaCents < 0 ? new Date() : undefined,
      },
    }),
    prisma.booking.update({
      where: { id: changeRequest.bookingId },
      data: {
        checkIn: changeRequest.requestedCheckIn,
        checkOut: changeRequest.requestedCheckOut,
        guests: changeRequest.requestedGuests,
        totalPriceCents: changeRequest.booking.totalPriceCents + changeRequest.priceDeltaCents,
      },
    }),
  ]);

  return NextResponse.json({ changeRequest: updatedRequest });
}

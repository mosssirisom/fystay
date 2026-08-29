import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";
import { canCancelBooking } from "@/lib/changeRequests";
import { previewCancellation } from "@/lib/cancellationPolicy";

/**
 * Cancels a booking and, if it was paid for, refunds it per the listing's
 * cancellation policy - never a blanket full refund. Every number here
 * (amount paid, refund owed, what's non-refundable) is computed fresh from
 * the database and the current time; nothing about the refund is ever taken
 * from the request. The client-side dialog shows a preview of the same
 * computation ahead of time purely so the guest isn't surprised, but this is
 * the only place the numbers that actually move money get decided.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.guestId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canCancelBooking(booking)) {
    return NextResponse.json(
      { error: "This booking can no longer be cancelled" },
      { status: 409 },
    );
  }

  const wasPaid = booking.paymentStatus === "PAID";
  const refund = previewCancellation({
    listing: booking.listing,
    wasPaid,
    totalPriceCents: booking.totalPriceCents,
    checkIn: booking.checkIn,
  });

  const stripe = getStripeClient();
  if (stripe && wasPaid && refund.refundCents > 0 && booking.stripePaymentIntentId) {
    await stripe.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
      amount: refund.refundCents,
    });
  }

  const paymentStatus = !wasPaid
    ? booking.paymentStatus
    : refund.refundCents === 0
      ? "PAID"
      : refund.refundCents >= refund.amountPaidCents
        ? "REFUNDED"
        : "PARTIALLY_REFUNDED";

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: "CANCELLED",
      paymentStatus,
      ...(wasPaid ? { refundedAmountCents: refund.refundCents } : {}),
      ...(wasPaid && refund.refundCents > 0 ? { refundedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ booking: updated, refund });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";
import { canCancelBooking } from "@/lib/changeRequests";
import { previewCancellation } from "@/lib/cancellationPolicy";
import { sendBookingCancelledEmails } from "@/lib/notificationEmails";

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
    include: { listing: { include: { host: true } } },
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
      // Only meaningful (and only accepted by Stripe) on a payment that
      // actually carried a transfer to the host's Connect account - see
      // Booking.hostPaidViaConnect. Reverses the same proportion of the
      // host's payout and platform fee as is being refunded to the guest,
      // rather than leaving a cancelled booking's money split unwound only
      // on FYStay's side.
      ...(booking.hostPaidViaConnect && {
        reverse_transfer: true,
        refund_application_fee: true,
      }),
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

  // Only when the booking was already CONFIRMED - a still-PENDING one was
  // never paid for or announced to the host in the first place (no
  // confirmation email ever went out for it), so a cancellation notice
  // would reference a booking neither side has actually seen yet.
  if (booking.status === "CONFIRMED") {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    await sendBookingCancelledEmails(
      {
        reference: booking.reference,
        listingTitle: booking.listing.title,
        city: booking.listing.city,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        guests: booking.guests,
        totalPriceCents: booking.totalPriceCents,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        hostName: booking.listing.host.name,
        hostEmail: booking.listing.host.email,
        bookingUrl: `${baseUrl}/bookings/${booking.id}`,
      },
      wasPaid ? refund.refundCents : 0,
    );
  }

  return NextResponse.json({ booking: updated, refund });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";
import { formatPrice } from "@/lib/format";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const { id, requestId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const changeRequest = await prisma.bookingChangeRequest.findUnique({
    where: { id: requestId },
    include: { booking: { include: { listing: true } } },
  });

  if (!changeRequest || changeRequest.bookingId !== id) {
    return NextResponse.json({ error: "Change request not found" }, { status: 404 });
  }
  if (changeRequest.booking.guestId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (changeRequest.status !== "APPROVED" || changeRequest.priceDeltaCents <= 0) {
    return NextResponse.json(
      { error: "This request doesn't need payment" },
      { status: 409 },
    );
  }
  if (changeRequest.paidAt) {
    return NextResponse.json({ error: "This change has already been paid for" }, { status: 409 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const stripe = getStripeClient();

  if (!stripe) {
    await applyApprovedChange(requestId);
    return NextResponse.json({
      url: `${baseUrl}/bookings?dev_confirmed=1`,
      devMode: true,
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `${changeRequest.booking.listing.title}: date change (+${formatPrice(changeRequest.priceDeltaCents)})`,
          },
          unit_amount: changeRequest.priceDeltaCents,
        },
        quantity: 1,
      },
    ],
    metadata: { changeRequestId: changeRequest.id },
    success_url: `${baseUrl}/bookings?success=1`,
    cancel_url: `${baseUrl}/bookings`,
  });

  await prisma.bookingChangeRequest.update({
    where: { id: requestId },
    data: { stripeSessionId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

/** Shared with the webhook handler for the real-Stripe path. */
export async function applyApprovedChange(requestId: string) {
  const changeRequest = await prisma.bookingChangeRequest.findUnique({
    where: { id: requestId },
    include: { booking: true },
  });
  if (!changeRequest || changeRequest.paidAt) return;

  await prisma.$transaction([
    prisma.bookingChangeRequest.update({
      where: { id: requestId },
      data: { paidAt: new Date() },
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
}

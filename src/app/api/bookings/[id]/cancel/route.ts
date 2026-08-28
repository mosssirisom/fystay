import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";
import { canCancelBooking } from "@/lib/changeRequests";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
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

  const stripe = getStripeClient();
  if (stripe && booking.status === "CONFIRMED" && booking.stripePaymentIntentId) {
    await stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ booking: updated });
}

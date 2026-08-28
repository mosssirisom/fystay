import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";
import { formatPrice } from "@/lib/format";

const checkoutSchema = z.object({
  bookingId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { listing: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.guestId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.status !== "PENDING") {
    return NextResponse.json(
      { error: "This booking has already been processed" },
      { status: 409 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const stripe = getStripeClient();

  if (!stripe) {
    // Stripe isn't configured (e.g. local dev without keys). Confirm directly
    // so the booking flow can still be exercised end to end.
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED" },
    });
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
            name: `${booking.listing.title}: ${formatPrice(booking.totalPriceCents)}`,
          },
          unit_amount: booking.totalPriceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId: booking.id },
    success_url: `${baseUrl}/bookings?success=1`,
    cancel_url: `${baseUrl}/listings/${booking.listingId}`,
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeSessionId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

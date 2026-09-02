import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";
import { decideExistingSessionAction } from "@/lib/checkoutSession";

const checkoutSchema = z.object({
  bookingId: z.string().min(1),
  guestName: z.string().trim().min(1, "Please enter your name.").max(200, "Name is too long.").optional(),
  guestEmail: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .max(200, "Email is too long.")
    .optional(),
  guestPhone: z
    .string()
    .trim()
    .min(1, "Please enter a phone number.")
    .max(50, "Phone number is too long.")
    .optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  let booking = await prisma.booking.findUnique({
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

  // Guest details entered/confirmed on the checkout page are saved onto the
  // booking right before payment, so they're captured even if the guest
  // never returns from Stripe (e.g. closes the tab mid-payment).
  if (parsed.data.guestName || parsed.data.guestEmail || parsed.data.guestPhone) {
    booking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        guestName: parsed.data.guestName ?? booking.guestName,
        guestEmail: parsed.data.guestEmail ?? booking.guestEmail,
        guestPhone: parsed.data.guestPhone ?? booking.guestPhone,
      },
      include: { listing: true },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const confirmationUrl = `${baseUrl}/bookings/${booking.id}/confirmation`;
  const stripe = getStripeClient();

  if (!stripe) {
    // Stripe isn't configured (e.g. local dev without keys). Confirm directly
    // so the booking flow can still be exercised end to end.
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", paymentStatus: "PAID", paidAt: new Date() },
    });
    return NextResponse.json({
      url: `${confirmationUrl}?dev_confirmed=1`,
      devMode: true,
    });
  }

  // A guest re-submitting (double-click, a second tab, hitting back then
  // forward) must never be handed a second live, payable session: that's a
  // real double-charge risk with two separate PaymentIntents, not just a
  // cosmetic duplicate. If a session from an earlier attempt is still
  // usable, send them back to that one instead of minting a new one.
  if (booking.stripeSessionId) {
    const existingSession = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
    const action = decideExistingSessionAction(existingSession.status);
    if (action === "reuse" && existingSession.url) {
      return NextResponse.json({ url: existingSession.url });
    }
    if (action === "already_paid") {
      return NextResponse.json({ url: `${confirmationUrl}?success=1` });
    }
    // "create_new": the old session expired unpaid; fall through below.
  }

  const lineItems = [
    {
      price_data: {
        currency: "gbp",
        product_data: {
          name: `${booking.listing.title}: ${booking.nights} night${booking.nights > 1 ? "s" : ""}`,
        },
        unit_amount: booking.nights * booking.nightlyPriceCents,
      },
      quantity: 1,
    },
  ];
  if (booking.cleaningFeeCents > 0) {
    lineItems.push({
      price_data: {
        currency: "gbp",
        product_data: { name: "Cleaning fee" },
        unit_amount: booking.cleaningFeeCents,
      },
      quantity: 1,
    });
  }
  if (booking.serviceFeeCents > 0) {
    lineItems.push({
      price_data: {
        currency: "gbp",
        product_data: { name: "FYStay service fee" },
        unit_amount: booking.serviceFeeCents,
      },
      quantity: 1,
    });
  }
  if (booking.taxCents > 0) {
    lineItems.push({
      price_data: {
        currency: "gbp",
        product_data: { name: "Taxes" },
        unit_amount: booking.taxCents,
      },
      quantity: 1,
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: booking.guestEmail ?? undefined,
    line_items: lineItems,
    metadata: { bookingId: booking.id },
    success_url: `${confirmationUrl}?success=1`,
    cancel_url: `${baseUrl}/checkout/${booking.id}?cancelled=1`,
  });

  // Conditional on stripeSessionId still being unset: if a concurrent
  // request already attached a different session in the moment between our
  // read above and this write, that session is the one the guest should
  // actually pay through, not the one this request just created.
  const attached = await prisma.booking.updateMany({
    where: { id: booking.id, stripeSessionId: null },
    data: { stripeSessionId: checkoutSession.id },
  });

  if (attached.count === 0) {
    const winner = await prisma.booking.findUnique({ where: { id: booking.id } });
    if (winner?.stripeSessionId) {
      const winningSession = await stripe.checkout.sessions.retrieve(winner.stripeSessionId);
      if (winningSession.url) {
        return NextResponse.json({ url: winningSession.url });
      }
    }
  }

  return NextResponse.json({ url: checkoutSession.url });
}

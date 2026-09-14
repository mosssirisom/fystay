import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";
import { decideExistingSessionAction } from "@/lib/checkoutSession";
import { tripExtraPurchaseError } from "@/lib/tripExtras";
import {
  sendTripExtraGuestConfirmationEmail,
  sendTripExtraProviderEmail,
} from "@/lib/notificationEmails";

/**
 * Lists what's available to add to this booking (see
 * docs/trip-extras-roadmap.md) alongside anything already purchased, so the
 * "Complete your trip" UI has everything it needs in one call.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({ where: { id }, select: { guestId: true } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.guestId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [offerings, purchased] = await Promise.all([
    prisma.extraOffering.findMany({
      where: { active: true, provider: { active: true } },
      include: { provider: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.bookingExtra.findMany({
      where: { bookingId: id },
      include: { offering: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    offerings: offerings.map((offering) => ({
      id: offering.id,
      name: offering.name,
      description: offering.description,
      category: offering.category,
      priceCents: offering.priceCents,
      providerName: offering.provider.name,
    })),
    purchased: purchased.map((extra) => ({
      id: extra.id,
      offeringId: extra.offeringId,
      offeringName: extra.offering.name,
      priceCents: extra.priceCents,
      status: extra.status,
    })),
  });
}

const purchaseSchema = z.object({
  offeringId: z.string().min(1),
  guestNotes: z.string().trim().max(2000, "That's a bit long - keep it under 2000 characters.").optional(),
});

/**
 * Buys one Trip Extra against this booking: creates the BookingExtra row
 * and a Stripe Checkout session charged to FYStay's own platform account
 * (never Connect - see the roadmap's "Payments" section, this is FYStay's
 * own product, not the host's nightly rate). The webhook is what actually
 * marks it paid and fires the provider/guest emails, the same separation
 * the main booking checkout already uses.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
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

  const offering = await prisma.extraOffering.findUnique({
    where: { id: parsed.data.offeringId },
    include: { provider: true },
  });
  if (!offering) {
    return NextResponse.json({ error: "This extra doesn't exist" }, { status: 404 });
  }

  const existingExtras = await prisma.bookingExtra.findMany({
    where: { bookingId: booking.id },
    select: { id: true, offeringId: true, status: true, stripeSessionId: true },
  });

  const stripe = getStripeClient();

  // A guest re-submitting (double-click, a second tab) for the exact same
  // still-unpaid extra reuses that attempt rather than piling up a second
  // chargeable session - the same reasoning as the main booking checkout's
  // own stripeSessionId reuse.
  const pendingForThisOffering = existingExtras.find(
    (extra) => extra.offeringId === offering.id && extra.status === "PENDING_PAYMENT" && extra.stripeSessionId,
  );
  if (pendingForThisOffering && stripe) {
    const existingSession = await stripe.checkout.sessions.retrieve(pendingForThisOffering.stripeSessionId!);
    const action = decideExistingSessionAction(existingSession.status);
    if (action === "reuse" && existingSession.url) {
      return NextResponse.json({ url: existingSession.url });
    }
    if (action === "already_paid") {
      return NextResponse.json(
        { error: "This extra has already been paid for - refresh the page" },
        { status: 409 },
      );
    }
    // "create_new": that attempt's session expired unpaid - fall through
    // and start a fresh one below, reusing the same row rather than
    // leaving an orphaned PENDING_PAYMENT one behind.
  }

  const eligibilityError = tripExtraPurchaseError(
    booking,
    { active: offering.active, providerActive: offering.provider.active },
    offering.id,
    existingExtras,
  );
  if (eligibilityError) {
    return NextResponse.json({ error: eligibilityError }, { status: 409 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const bookingUrl = `${baseUrl}/bookings/${booking.id}`;

  if (!stripe) {
    // Stripe isn't configured (e.g. local dev without keys) - confirm
    // directly, same fallback the main booking checkout uses, so this
    // feature stays fully exercisable without real Stripe keys.
    const bookingExtra = pendingForThisOffering
      ? await prisma.bookingExtra.update({
          where: { id: pendingForThisOffering.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            guestNotes: parsed.data.guestNotes ?? null,
          },
        })
      : await prisma.bookingExtra.create({
          data: {
            bookingId: booking.id,
            offeringId: offering.id,
            priceCents: offering.priceCents,
            guestNotes: parsed.data.guestNotes ?? null,
            status: "PAID",
            paidAt: new Date(),
          },
        });

    await notifyTripExtraPaid(bookingExtra.id);
    return NextResponse.json({ devMode: true, paid: true });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: booking.guestEmail ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: { name: `${offering.name} (${offering.provider.name})` },
          unit_amount: offering.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { purpose: "trip_extra" },
    success_url: `${bookingUrl}?extra_success=1`,
    cancel_url: `${bookingUrl}?extra_cancelled=1`,
  });

  const bookingExtra = pendingForThisOffering
    ? await prisma.bookingExtra.update({
        where: { id: pendingForThisOffering.id },
        data: {
          stripeSessionId: checkoutSession.id,
          guestNotes: parsed.data.guestNotes ?? null,
        },
      })
    : await prisma.bookingExtra.create({
        data: {
          bookingId: booking.id,
          offeringId: offering.id,
          priceCents: offering.priceCents,
          guestNotes: parsed.data.guestNotes ?? null,
          stripeSessionId: checkoutSession.id,
        },
      });

  // The session's own metadata needs this row's id, but Stripe requires the
  // line items/price before a session exists to get an id from - so the
  // session is created first, then the BookingExtra row it belongs to is
  // stamped onto it via a metadata update, same two-step shape as
  // src/lib/securityDeposit.ts's own createDepositCheckoutSession callers.
  await stripe.checkout.sessions.update(checkoutSession.id, {
    metadata: { purpose: "trip_extra", bookingExtraId: bookingExtra.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

/**
 * Shared by both the dev-mode (no Stripe keys) fallback above and the real
 * Stripe webhook: sends the provider their booking-request email and the
 * guest their receipt, and records whether the provider email actually
 * went out. Exported so the webhook route can call the exact same logic
 * rather than duplicating it.
 */
export async function notifyTripExtraPaid(bookingExtraId: string): Promise<void> {
  const bookingExtra = await prisma.bookingExtra.findUniqueOrThrow({
    where: { id: bookingExtraId },
    include: {
      offering: { include: { provider: true } },
      booking: { include: { listing: true } },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const ctx = {
    guestName: bookingExtra.booking.guestName,
    guestEmail: bookingExtra.booking.guestEmail,
    guestNotes: bookingExtra.guestNotes,
    listingTitle: bookingExtra.booking.listing.title,
    checkIn: bookingExtra.booking.checkIn,
    checkOut: bookingExtra.booking.checkOut,
    offeringName: bookingExtra.offering.name,
    priceCents: bookingExtra.priceCents,
    providerName: bookingExtra.offering.provider.name,
    providerEmail: bookingExtra.offering.provider.notificationEmail,
    bookingUrl: `${baseUrl}/bookings/${bookingExtra.bookingId}`,
  };

  const sentToProvider = await sendTripExtraProviderEmail(ctx);
  await sendTripExtraGuestConfirmationEmail(ctx);

  if (sentToProvider) {
    await prisma.bookingExtra.update({
      where: { id: bookingExtraId },
      data: { sentToProviderAt: new Date() },
    });
  }
}

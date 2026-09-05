import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { applyApprovedChange } from "@/app/api/bookings/[id]/change-requests/[requestId]/pay/route";
import { connectFlagsFromAccount } from "@/lib/stripeConnect";
import { sendBookingConfirmedEmails } from "@/lib/notificationEmails";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 501 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object;
    const bookingId = checkoutSession.metadata?.bookingId;
    const changeRequestId = checkoutSession.metadata?.changeRequestId;
    if (bookingId) {
      // Stripe's own docs are explicit that a webhook endpoint must tolerate
      // the same event arriving more than once (a retry after a slow 200, or
      // just an occasional genuine duplicate). Scoping the update to bookings
      // not already CONFIRMED makes a redelivery a pure no-op instead of
      // re-sending the guest and host their confirmation email a second (or
      // third) time for a booking that was already confirmed the first time.
      const { count } = await prisma.booking.updateMany({
        where: { id: bookingId, status: { not: "CONFIRMED" } },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paidAt: new Date(),
          stripePaymentIntentId:
            typeof checkoutSession.payment_intent === "string"
              ? checkoutSession.payment_intent
              : undefined,
        },
      });

      if (count > 0) {
        const booking = await prisma.booking.findUniqueOrThrow({
          where: { id: bookingId },
          include: { listing: { include: { host: true } } },
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        await sendBookingConfirmedEmails({
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
        });
      }
    } else if (changeRequestId) {
      await applyApprovedChange(changeRequestId);
    }
  } else if (event.type === "account.updated") {
    // Fires on every change to a connected account, including ones this app
    // never directly caused (Stripe re-verifying details, a host adding a
    // bank account from their own Express dashboard). Written by account id
    // rather than a stored userId, since that's all this event carries -
    // see also refreshConnectAccountStatus, which does the same lookup for
    // a host returning from onboarding without waiting on this webhook.
    const account = event.data.object;
    await prisma.user
      .update({
        where: { stripeConnectAccountId: account.id },
        data: connectFlagsFromAccount(account),
      })
      .catch(() => {
        // No user has this account id yet (e.g. a stale/test event) -
        // nothing to update, and not worth failing the webhook over.
      });
  } else if (event.type === "checkout.session.expired") {
    // The guest never completed payment and Stripe's own session TTL ran
    // out (e.g. they abandoned the card form). Only ever touches a booking
    // still PENDING: if it's already CONFIRMED, some other session for the
    // same booking succeeded first, and this stale expiry must not cancel
    // a paid stay.
    const bookingId = event.data.object.metadata?.bookingId;
    if (bookingId) {
      await prisma.booking.updateMany({
        where: { id: bookingId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { applyApprovedChange } from "@/app/api/bookings/[id]/change-requests/[requestId]/pay/route";

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
      await prisma.booking.update({
        where: { id: bookingId },
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
    } else if (changeRequestId) {
      await applyApprovedChange(changeRequestId);
    }
  }

  return NextResponse.json({ received: true });
}

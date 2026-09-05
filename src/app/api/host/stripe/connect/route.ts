import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";

/**
 * Starts (or resumes) a host's Stripe Express onboarding. A plain GET, not a
 * POST+fetch, so the "Connect with Stripe" button on /host/payouts can just
 * be a link - and so Stripe's own account-link refresh_url (used if a link
 * expires before the host finishes) can point straight back here to mint a
 * fresh one, rather than needing a second route.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "HOST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.redirect(`${baseUrl}/host/payouts?error=stripe_not_configured`);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  let accountId = user.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeConnectAccountId: accountId },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/api/host/stripe/connect`,
    return_url: `${baseUrl}/host/payouts?onboarding=return`,
    type: "account_onboarding",
  });

  return NextResponse.redirect(accountLink.url);
}

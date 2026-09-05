import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

/**
 * A host is only actually payable once Stripe reports both flags true -
 * details_submitted alone (or charges_enabled alone) can mean an
 * in-progress or restricted account that can't yet receive a transfer.
 * Kept as a single predicate so every call site (checkout, the dashboard
 * banner, the change-request payment) agrees on what "ready" means.
 */
export function isConnectReady(host: {
  stripeConnectChargesEnabled: boolean;
  stripeConnectPayoutsEnabled: boolean;
}): boolean {
  return host.stripeConnectChargesEnabled && host.stripeConnectPayoutsEnabled;
}

/** Maps a Stripe Account object onto the three flags this app persists. */
export function connectFlagsFromAccount(account: Stripe.Account) {
  return {
    stripeConnectDetailsSubmitted: Boolean(account.details_submitted),
    stripeConnectChargesEnabled: Boolean(account.charges_enabled),
    stripeConnectPayoutsEnabled: Boolean(account.payouts_enabled),
  };
}

/**
 * Re-reads a connected account's status directly from Stripe and persists
 * it. The account.updated webhook does this too, but a host returning from
 * Stripe's own onboarding flow shouldn't have to wait on a webhook (which
 * may not even be configured yet in local development) just to see their
 * own status update - see /host/payouts, which calls this on the
 * onboarding return redirect.
 */
export async function refreshConnectAccountStatus(accountId: string) {
  const stripe = getStripeClient();
  if (!stripe) return null;
  const account = await stripe.accounts.retrieve(accountId);
  const flags = connectFlagsFromAccount(account);
  await prisma.user.update({ where: { stripeConnectAccountId: accountId }, data: flags });
  return flags;
}

/**
 * Given the status Stripe reports for a Checkout Session already attached
 * to a booking, decides what a re-submitted /api/checkout request (a
 * double-click, a second tab, hitting back then forward) should do:
 *
 * - "reuse": the guest hasn't paid yet and the session is still payable.
 *   Send them back to the exact same session rather than minting a second,
 *   separately chargeable one for the same booking.
 * - "already_paid": Stripe says the payment completed, but our own webhook
 *   hasn't landed yet. Never create a new chargeable session for a booking
 *   that's already been paid for; send the guest to the page that polls
 *   for the webhook instead.
 * - "create_new": the old session's own TTL expired without payment (or
 *   Stripe reports a status this app doesn't otherwise recognize), so
 *   there's nothing left to reuse and a fresh session is the safe default.
 */
export type ExistingSessionAction = "reuse" | "already_paid" | "create_new";

export function decideExistingSessionAction(status: string | null): ExistingSessionAction {
  if (status === "open") return "reuse";
  if (status === "complete") return "already_paid";
  return "create_new";
}

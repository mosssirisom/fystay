import type Stripe from "stripe";

/**
 * Stripe Identity (stripe.com/identity) - real government-ID + selfie
 * verification, reusing the Stripe account this app already has for
 * payments rather than standing up a second vendor just for this. Uses
 * Stripe's hosted verification page (the VerificationSession's own `url`)
 * the same way checkout already redirects to Stripe-hosted Checkout,
 * rather than embedding Stripe's Identity Elements client-side.
 *
 * Never called with the metadata.userId omitted - the
 * identity.verification_session.* webhook handlers key off it to know
 * which User row a given session belongs to, since Stripe has no other
 * way to tell FYStay who was being verified.
 */
export async function createIdentityVerificationSession(
  stripe: Stripe,
  params: { userId: string; returnUrl: string },
): Promise<Stripe.Identity.VerificationSession> {
  return stripe.identity.verificationSessions.create({
    type: "document",
    metadata: { userId: params.userId },
    return_url: params.returnUrl,
    options: {
      document: {
        require_matching_selfie: true,
      },
    },
  });
}

/**
 * A small, genuine analytics-event system for measuring travel add-on
 * cross-sell performance (see docs/trip-extras-roadmap.md) - built as real,
 * queryable infrastructure (an AnalyticsEvent row per event) rather than a
 * call into a third-party provider, since no GA/PostHog/Segment key exists
 * anywhere in this app yet. Swapping in a real provider later means adding
 * one more send inside track() below, not restructuring every call site.
 *
 * `category` is deliberately a plain string (an ExtraCategory value today,
 * but never typed as that enum) so a future add-on category - or a
 * completely different kind of cross-sell - never needs this file, the API
 * route, or the DB schema to change to start recording events.
 */

/** The events this phase's brief asks for, plus room to grow: any string
 * is accepted by trackAddonEvent, this union just gives the known ones
 * autocomplete and typo-safety at call sites. `transfer_intent_added` and
 * `transfer_added` are deliberately separate names, not the same event
 * fired from two places - the former is a pre-checkout click with no
 * money moved yet (TransferStepCard's "Add airport transfer" button,
 * fired client-side), the latter only ever fires server-side once a
 * purchase actually completes (see the extras route's own comment) -
 * merging them would conflate clicks with real revenue in any future
 * report built on this data. */
export type AddonAnalyticsEvent =
  | "transfer_offer_viewed"
  | "transfer_offer_clicked"
  | "transfer_intent_added"
  | "transfer_added"
  | "transfer_skipped"
  | "transfer_booking_completed";

export type AddonAnalyticsPayload = {
  name: AddonAnalyticsEvent | (string & {});
  /** Which add-on category this concerns - "AIRPORT_TRANSFER" today, free-text so future categories (attractions, car hire, experiences, restaurant bookings) never need a schema change. */
  category?: string;
  /** Where in the product this fired - "homepage" | "property_page" | "booking_flow" | "confirmation" | "account" | ... */
  surface?: string;
  bookingId?: string;
  offeringId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Fire-and-forget: never awaited by a caller, never throws, never blocks
 * or delays the interaction it's attached to. A dropped analytics event is
 * an acceptable loss; a button that feels slow because it's waiting on a
 * tracking call is not. Client-side only (uses fetch against this app's
 * own API route) - every current call site is a browser interaction.
 */
export function trackAddonEvent(payload: AddonAnalyticsPayload): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(payload);
    // sendBeacon survives a navigation started immediately after (e.g. a
    // CTA that both tracks a click and pushes to a new route in the same
    // handler) - fetch with keepalive is the fallback for browsers/test
    // environments without it.
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/events", blob);
      return;
    }
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Swallowed - see doc comment above.
    });
  } catch {
    // Swallowed - see doc comment above.
  }
}

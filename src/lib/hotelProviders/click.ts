import { createHash } from "node:crypto";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ClickSubIdInput = {
  /** AffiliateHotel.id - resolved server-side from a DB lookup, never a raw client-supplied id (see the redirect route's own top comment). */
  hotelId: string;
  /** The specific deal/room a guest clicked, if the provider's availability response had one - purely for reconciliation granularity, never used to look anything up. */
  externalRoomId?: string | null;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  rooms: number;
  /**
   * The visitor's own attribution key - an authenticated user's id, or the
   * anonymous per-browser identifier from src/lib/visitorId.ts. This must
   * always come from data the server itself already trusts (a verified
   * session, or a cookie the server previously issued) - never a value
   * read directly off the incoming click request, or any guest could
   * attribute a click to an arbitrary other user/session just by naming it
   * in the URL.
   */
  visitorKey: string;
  now?: Date;
};

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Builds AffiliateClick.subId deterministically from server-resolved
 * inputs only - see this file's own field-level comments on why nothing
 * here is ever trusted straight off the click request. That determinism is
 * exactly what closes off "sub-ID manipulation" and "cross-user/session
 * attribution" as attacks: there is no field on the request this function
 * reads, so there is nothing for a guest to tamper with that would change
 * whose click gets recorded or which sub-ID it gets.
 *
 * Deterministic within one UTC-local calendar day, not forever: two rapid
 * repeat clicks - a double-click, or the guest hitting back/refresh and
 * clicking again minutes later for the same hotel/dates/guests - collapse
 * onto the same subId, so the redirect route's unique-constraint-conflict
 * handling can recognize it as the same click and skip inserting a
 * duplicate row (see that route's own comment). A visit on a *different*
 * calendar day produces a different subId and is correctly counted as a
 * new click - the boundary a value with no time component at all could
 * never draw (it would dedupe forever), and one with no stable component
 * at all could never draw either (it would never dedupe).
 */
export function computeClickSubId(input: ClickSubIdInput): string {
  const now = input.now ?? new Date();
  const dayBucket = Math.floor(now.getTime() / MS_PER_DAY);
  const raw = [
    input.hotelId,
    input.externalRoomId ?? "",
    dateKey(input.checkIn),
    dateKey(input.checkOut),
    input.adults,
    input.children,
    input.rooms,
    input.visitorKey,
    dayBucket,
  ].join(":");
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 32);
  // "hc" (hotel click) prefix keeps these visually distinct from the
  // cuid()-default subId shape Prisma would otherwise generate, purely as
  // a debugging aid when reading raw rows.
  return `hc_${hash}`;
}

/**
 * Every host a deep link is ever allowed to actually send a guest to, keyed
 * by HotelProvider.code - checked against adapter.createDeepLink()'s own
 * output right before redirecting (see the redirect route). This is
 * deliberately independent of anything in the click request: the guest
 * never supplies a URL or a host, so this isn't defending against a
 * tampered request so much as against a *future bug* in some adapter
 * returning an unexpected host - the redirect route refuses to follow a
 * deep link to anywhere not on this list, full stop.
 *
 * "booking_com" has no entry on purpose - that adapter's own
 * createDeepLink() always throws (the live Demand API deep-link shape
 * isn't confirmed yet - see providers/bookingCom.ts), so there is no real
 * host to allowlist until Phase 8+ confirms one. Adding a provider here is
 * always paired with confirming its adapter actually returns that host.
 */
const ALLOWED_DEEP_LINK_HOSTS: Record<string, readonly string[]> = {
  mock: ["mock-hotel-provider.invalid"],
};

/** True only if `url` is https and its host is on the resolved provider's own allowlist above. */
export function isAllowedDeepLinkUrl(providerCode: string, url: string): boolean {
  const allowedHosts = ALLOWED_DEEP_LINK_HOSTS[providerCode];
  if (!allowedHosts || allowedHosts.length === 0) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === "https:" && allowedHosts.includes(parsed.hostname);
}

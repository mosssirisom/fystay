export const VISITOR_ID_COOKIE = "fystay_vid";
export const VISITOR_ID_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * A loose, self-issued anonymous identifier for grouping one anonymous
 * guest's own affiliate-click history (AffiliateClick.sessionId) - NOT an
 * auth or security boundary, the same trust model as any first-party
 * analytics cookie. A guest can clear it, or hand-edit their own copy to
 * any string they like, but that only ever changes how *their own* future
 * clicks group together - there is no way to read or set another visitor's
 * copy of this cookie from outside their own browser, so it can't be used
 * to attribute a click to somebody else's session (see the redirect
 * route's own comment on why cross-user attribution isn't possible here).
 * A logged-in guest's authenticated userId (from auth()) is the
 * authoritative identity for a click regardless of this value.
 */

/** Reads the raw `Cookie` request header - pure string parsing, no cookie-jar API, so this is trivial to unit test without a real Request. */
export function readVisitorId(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = part.slice(0, separatorIndex).trim();
    if (key !== VISITOR_ID_COOKIE) continue;
    const value = part.slice(separatorIndex + 1).trim();
    return value || null;
  }
  return null;
}

/** Options every route setting this cookie should use - centralized so they can never quietly drift apart. httpOnly since nothing client-side ever needs to read it (see AttributedClick's own server-only usage). */
export function visitorIdCookieOptions(): {
  name: string;
  maxAge: number;
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
} {
  return {
    name: VISITOR_ID_COOKIE,
    maxAge: VISITOR_ID_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

/**
 * Only a same-origin, relative path is safe to pass to next/navigation's
 * router.push/replace: unlike <a href>, they will execute a `javascript:`
 * URL in the page's own context, and a `//` or absolute URL navigates the
 * browser off-site. Both are reachable here via the `?callbackUrl=` query
 * param, so every value must go through this before reaching the router.
 *
 * Returns null (rather than a fallback) for a missing or unsafe value, so
 * callers can still apply their own `??` fallback logic.
 */
export function sanitizeCallbackUrl(callbackUrl: string | null | undefined): string | null {
  if (!callbackUrl) return null;
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) return null;
  try {
    // Resolving against a fixed base surfaces anything that isn't a plain
    // relative path (e.g. "/\evil.com", "/%2F%2Fevil.com") as a different
    // origin once the browser normalises it.
    const resolved = new URL(callbackUrl, "https://fystay.invalid");
    if (resolved.origin !== "https://fystay.invalid") return null;
  } catch {
    return null;
  }
  return callbackUrl;
}

export function safeRedirectPath(callbackUrl: string | null | undefined, fallback = "/"): string {
  return sanitizeCallbackUrl(callbackUrl) ?? fallback;
}

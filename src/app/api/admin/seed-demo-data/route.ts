import { NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * Temporary, manually-triggered endpoint to run prisma/seed.ts's demo data
 * against a deployment's database - for standing up a fresh preview/staging
 * database with the same visual demo content the local dev DB has, without
 * needing a direct Postgres connection to it. Gated behind SEED_DEMO_SECRET
 * (unset by default, so this refuses every request until someone
 * deliberately configures it) rather than any session/role check, since an
 * empty database has no admin user yet to authenticate as.
 *
 * Delete this route once it's no longer needed - it's a one-off tool for
 * bootstrapping a database's demo content, not a feature.
 *
 * GET (not POST) and a query param (not an Authorization header) purely so
 * this can be triggered with a plain URL fetch - there's no browser or
 * scriptable client in the loop for this one-off, just a URL pasted or
 * fetched directly.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.SEED_DEMO_SECRET;
  if (!secret) return false;
  const provided = new URL(request.url).searchParams.get("secret");
  return provided === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Dynamic import (not a static top-level one) so prisma/seed.ts's
  // module-level `main().catch().finally()` only runs once this request is
  // actually authorized, not on every cold start that happens to load this
  // route's bundle.
  await import("../../../../../prisma/seed");

  return NextResponse.json({ ok: true });
}

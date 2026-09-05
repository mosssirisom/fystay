import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

/**
 * A fixed-window request counter backed by Postgres, not an in-memory Map -
 * FYStay runs as short-lived serverless functions (Vercel), each with its
 * own process memory, so an in-process counter would reset on every cold
 * start and wouldn't actually stop anything, let alone agree across
 * concurrent instances. The upsert below is a single atomic statement (one
 * row, one round trip): two concurrent requests for the same key can't both
 * read a stale count and both be let through, the way a separate
 * read-then-write would allow.
 *
 * A window "resets" the first time it's hit after windowMs has elapsed
 * since it started, rather than on a wall-clock boundary - simpler than a
 * sliding log, and precise enough for abuse protection on a handful of
 * auth-adjacent endpoints.
 */
export async function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
  now?: Date;
}): Promise<RateLimitResult> {
  const { key, limit, windowMs, now = new Date() } = params;
  const staleBefore = new Date(now.getTime() - windowMs);

  const rows = await prisma.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO "RateLimitHit" ("key", "windowStart", "count")
    VALUES (${key}, ${now}, 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitHit"."windowStart" <= ${staleBefore} THEN 1
        ELSE "RateLimitHit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitHit"."windowStart" <= ${staleBefore} THEN ${now}
        ELSE "RateLimitHit"."windowStart"
      END
    RETURNING "count", "windowStart"
  `;

  const row = rows[0];
  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    resetAt: new Date(row.windowStart.getTime() + windowMs),
  };
}

/** The client's IP as reported by the platform's proxy (Vercel sets this on every request). Falls back to a single shared bucket if it's missing, e.g. in local development. */
export function clientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

export function rateLimitedResponse(result: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

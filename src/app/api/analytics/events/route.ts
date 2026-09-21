import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { withApiErrorHandling } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp, rateLimitedResponse } from "@/lib/rateLimit";

const eventSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().max(100).optional(),
  surface: z.string().max(100).optional(),
  bookingId: z.string().max(100).optional(),
  offeringId: z.string().max(100).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Public by design - fired from the homepage and property pages before a
 * visitor has ever signed in (see src/lib/analytics.ts's trackAddonEvent).
 * Rate-limited by IP rather than requiring auth, same reasoning as
 * signup's own IP-keyed limit: this endpoint must stay open to logged-out
 * traffic while still capping how many rows one source can write.
 */
async function postHandler(request: Request) {
  const rateLimit = await checkRateLimit({
    key: `analytics:${clientIp(request)}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitedResponse(rateLimit);

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const session = await auth().catch(() => null);
  const { name, category, surface, bookingId, offeringId, metadata } = parsed.data;

  await prisma.analyticsEvent.create({
    data: {
      name,
      category,
      surface,
      bookingId,
      offeringId,
      userId: session?.user?.id,
      metadata: metadata as never,
    },
  });

  return NextResponse.json({ ok: true });
}

export const POST = withApiErrorHandling(postHandler);

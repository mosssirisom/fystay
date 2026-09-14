import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPmsAdapter } from "@/lib/pms/registry";
import { parseProvider, pmsWebhookSecret } from "@/lib/pms/routeHelpers";
import { runConnectionSync } from "@/lib/pms/sync";
import type { PmsWebhookRequest } from "@/lib/pms/types";

export const maxDuration = 60;

/**
 * Inbound webhook delivery target for a PMS/channel manager that pushes
 * near-real-time updates (adapter.supportsWebhooks) - the near-real-time
 * counterpart to the nightly reconciliation cron, which stays in place as
 * the backstop for any delivery this endpoint misses, rejects, or a
 * provider that doesn't support webhooks at all.
 *
 * Deliberately coarse-grained: rather than inventing per-event-type
 * handling against a payload shape that isn't verified yet (see
 * cloudbeds.ts's own file-level comment), any recognized, verified event
 * simply triggers a full runConnectionSync for the connection it belongs
 * to - the same pull the "Sync now" button and the cron already do. A
 * webhook this route can't verify or resolve to a known connection is
 * recorded but never trusted enough to act on.
 */
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerParam } = await params;
  const provider = parseProvider(providerParam);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const adapter = getPmsAdapter(provider);
  if (!adapter.supportsWebhooks || !adapter.verifyWebhookSignature || !adapter.parseWebhookEvents) {
    return NextResponse.json({ error: "This provider does not support webhooks" }, { status: 404 });
  }

  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const webhookRequest: PmsWebhookRequest = { headers, rawBody };

  // Fails closed for any provider whose signing scheme isn't confirmed yet
  // (currently all three - see each adapter's own verifyWebhookSignature).
  // A 401 here is expected and correct until that's implemented for real,
  // not a bug in this route.
  if (!adapter.verifyWebhookSignature(webhookRequest, pmsWebhookSecret(provider))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let events;
  try {
    events = adapter.parseWebhookEvents(webhookRequest);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const results: { externalEventId: string; outcome: string }[] = [];

  for (const event of events) {
    const existing = await prisma.pmsWebhookEvent.findUnique({
      where: { provider_externalEventId: { provider, externalEventId: event.externalEventId } },
    });
    // Idempotent redelivery guard, same purpose as the Stripe webhook's own
    // "don't re-apply an event we've already processed" scoping - a
    // provider retrying a slow/unacknowledged delivery must never trigger
    // the same sync twice.
    if (existing?.processedAt) {
      results.push({ externalEventId: event.externalEventId, outcome: "duplicate" });
      continue;
    }

    const connection = event.externalPropertyId
      ? await prisma.pmsConnection.findFirst({
          where: { provider, externalPropertyId: event.externalPropertyId, status: "CONNECTED" },
        })
      : null;

    const record = await prisma.pmsWebhookEvent.upsert({
      where: { provider_externalEventId: { provider, externalEventId: event.externalEventId } },
      create: {
        provider,
        externalEventId: event.externalEventId,
        eventType: event.eventType,
        payload: event as unknown as Prisma.InputJsonValue,
        connectionId: connection?.id ?? null,
      },
      update: {},
    });

    if (!connection) {
      await prisma.pmsWebhookEvent.update({
        where: { id: record.id },
        data: {
          status: "FAILURE",
          errorMessage: "No connected connection matches this event's property",
          processedAt: new Date(),
        },
      });
      results.push({ externalEventId: event.externalEventId, outcome: "unmatched" });
      continue;
    }

    try {
      await runConnectionSync(prisma, connection.id);
      await prisma.pmsWebhookEvent.update({
        where: { id: record.id },
        data: { status: "SUCCESS", processedAt: new Date() },
      });
      results.push({ externalEventId: event.externalEventId, outcome: "synced" });
    } catch (error) {
      await prisma.pmsWebhookEvent.update({
        where: { id: record.id },
        data: {
          status: "FAILURE",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          processedAt: new Date(),
        },
      });
      results.push({ externalEventId: event.externalEventId, outcome: "failed" });
    }
  }

  return NextResponse.json({ received: true, events: results });
}

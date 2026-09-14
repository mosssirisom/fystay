import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseProvider } from "@/lib/pms/routeHelpers";
import { runConnectionSync } from "@/lib/pms/sync";

// A sync fans out to one live API call per mapped room (rates,
// restrictions, reservations) - generous but bounded, matching the same
// "stay inside Vercel Hobby's 60s ceiling" reasoning the other cron/sync
// routes in this codebase already use.
export const maxDuration = 60;

/** The host-facing "Sync now" button - runs the same full pull the nightly reconciliation cron does, on demand, for one connection. */
export async function POST(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerParam } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "HOST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const provider = parseProvider(providerParam);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });

  const connection = await prisma.pmsConnection.findUnique({
    where: { hostId_provider: { hostId: session.user.id, provider } },
  });
  if (!connection) return NextResponse.json({ error: "Not connected" }, { status: 404 });

  const summary = await runConnectionSync(prisma, connection.id);
  return NextResponse.json({ summary });
}

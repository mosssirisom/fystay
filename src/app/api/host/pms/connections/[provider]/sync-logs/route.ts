import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseProvider } from "@/lib/pms/routeHelpers";

/** The "view errors" detail behind the integrations page's summary card - the last 20 sync attempts for this connection, most recent first. */
export async function GET(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerParam } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = parseProvider(providerParam);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });

  const connection = await prisma.pmsConnection.findUnique({
    where: { hostId_provider: { hostId: session.user.id, provider } },
  });
  if (!connection) return NextResponse.json({ error: "Not connected" }, { status: 404 });

  const logs = await prisma.pmsSyncLog.findMany({
    where: { connectionId: connection.id },
    orderBy: { startedAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ logs });
}

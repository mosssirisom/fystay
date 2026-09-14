import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseProvider } from "@/lib/pms/routeHelpers";

/** Disconnects a provider: clears the stored credentials outright (never left encrypted-but-unused) and flips status back to DISCONNECTED. Room mappings and sync history are kept, not deleted, so reconnecting the same provider later doesn't force the host to redo their room mapping from scratch. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerParam } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = parseProvider(providerParam);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });

  const connection = await prisma.pmsConnection.findUnique({
    where: { hostId_provider: { hostId: session.user.id, provider } },
  });
  if (!connection) return NextResponse.json({ error: "Not connected" }, { status: 404 });

  await prisma.pmsConnection.update({
    where: { id: connection.id },
    data: {
      status: "DISCONNECTED",
      credentialsCiphertext: null,
      tokenExpiresAt: null,
      disconnectedAt: new Date(),
    },
  });

  return NextResponse.json({ disconnected: true });
}

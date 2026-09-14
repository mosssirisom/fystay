import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPmsAdapter } from "@/lib/pms/registry";
import { parseProvider } from "@/lib/pms/routeHelpers";
import { getValidCredentials } from "@/lib/pms/sync";
import { PmsAdapterError } from "@/lib/pms/types";

/** Lists this connection's PMS rooms for its chosen property, alongside which of them are already mapped - what the host-facing mapping table (Cloudbeds room ⇄ FYStay listing/room type) renders directly. */
export async function GET(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerParam } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = parseProvider(providerParam);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });

  const connection = await prisma.pmsConnection.findUnique({
    where: { hostId_provider: { hostId: session.user.id, provider } },
    include: { roomMappings: { include: { listing: { select: { id: true, title: true } }, roomType: { select: { id: true, name: true } } } } },
  });
  if (!connection || !connection.credentialsCiphertext || !connection.externalPropertyId) {
    return NextResponse.json({ error: "No property selected yet" }, { status: 404 });
  }

  const adapter = getPmsAdapter(provider);
  try {
    const credentials = await getValidCredentials(prisma, connection, adapter);
    if (!credentials) return NextResponse.json({ error: "Not connected" }, { status: 404 });
    const rooms = await adapter.listRooms(credentials, connection.externalPropertyId);

    const mappingByRoomId = new Map(connection.roomMappings.map((m) => [m.externalRoomId, m]));
    const roomsWithMapping = rooms.map((room) => {
      const mapping = mappingByRoomId.get(room.externalRoomId);
      return {
        ...room,
        mapping: mapping
          ? {
              id: mapping.id,
              listingId: mapping.listingId,
              listingTitle: mapping.listing.title,
              roomTypeId: mapping.roomTypeId,
              roomTypeName: mapping.roomType?.name ?? null,
            }
          : null,
      };
    });

    return NextResponse.json({ rooms: roomsWithMapping });
  } catch (error) {
    const message = error instanceof PmsAdapterError ? error.message : "Could not list rooms";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

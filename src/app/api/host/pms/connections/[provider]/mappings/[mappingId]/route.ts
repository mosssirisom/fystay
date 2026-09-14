import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseProvider } from "@/lib/pms/routeHelpers";

/** Removes a room mapping - the PMS room and the FYStay listing/room type it pointed at are both untouched; only the link (and any future sync against it) stops. Past AvailabilityBlock/PmsReservationLink rows already created from it are left in place, same as disconnecting an iCal import leaves its previously-synced blocks. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ provider: string; mappingId: string }> },
) {
  const { provider: providerParam, mappingId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = parseProvider(providerParam);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });

  const mapping = await prisma.pmsRoomMapping.findUnique({
    where: { id: mappingId },
    include: { connection: true },
  });
  if (!mapping || mapping.connection.hostId !== session.user.id || mapping.connection.provider !== provider) {
    return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
  }

  await prisma.pmsRoomMapping.delete({ where: { id: mappingId } });
  return NextResponse.json({ deleted: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { blockingBookingWhere, blockingRanges, isRangeAvailable } from "@/lib/availability";
import { isValidBlockRange } from "@/lib/availabilityBlocks";

const createBlockSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().trim().max(200).optional(),
});

/** A host manually closing a date range on their own listing's calendar. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (!isValidBlockRange(startDate, endDate)) {
    return NextResponse.json(
      { error: "End date must be after the start date" },
      { status: 400 },
    );
  }

  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: { listingId: id, ...blockingBookingWhere() },
      select: { checkIn: true, checkOut: true },
    }),
    prisma.availabilityBlock.findMany({
      where: { listingId: id },
      select: { startDate: true, endDate: true },
    }),
  ]);

  if (!isRangeAvailable(startDate, endDate, blockingRanges(bookings, blocks))) {
    return NextResponse.json(
      { error: "Those dates overlap an existing booking or block" },
      { status: 409 },
    );
  }

  const block = await prisma.availabilityBlock.create({
    data: { listingId: id, startDate, endDate, reason: parsed.data.reason },
  });

  return NextResponse.json({ block }, { status: 201 });
}

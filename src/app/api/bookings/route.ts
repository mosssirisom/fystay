import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { blockingBookingWhere, isRangeAvailable, nightsBetween } from "@/lib/availability";

const createBookingSchema = z.object({
  listingId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.number().int().min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { guestId: session.user.id },
    include: { listing: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { listingId, guests } = parsed.data;
  const checkIn = new Date(parsed.data.checkIn);
  const checkOut = new Date(parsed.data.checkOut);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  // The calendar UI already disables past dates, but that's client-side
  // only — enforce it here too, since this endpoint is reachable directly.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkIn < today) {
    return NextResponse.json({ error: "Check-in date must be in the future" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      bookings: {
        where: blockingBookingWhere(),
        select: { checkIn: true, checkOut: true },
      },
    },
  });

  if (!listing || !listing.published) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (guests > listing.maxGuests) {
    return NextResponse.json(
      { error: `This listing sleeps up to ${listing.maxGuests} guests` },
      { status: 400 },
    );
  }
  if (!isRangeAvailable(checkIn, checkOut, listing.bookings)) {
    return NextResponse.json(
      { error: "Those dates are not available" },
      { status: 409 },
    );
  }

  const nights = nightsBetween(checkIn, checkOut);
  const totalPriceCents = nights * listing.pricePerNightCents;

  const booking = await prisma.booking.create({
    data: {
      listingId,
      guestId: session.user.id,
      checkIn,
      checkOut,
      guests,
      totalPriceCents,
    },
  });

  return NextResponse.json({ booking }, { status: 201 });
}

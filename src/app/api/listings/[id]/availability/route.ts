import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { blockingBookingWhere, isRangeAvailable, nightsBetween } from "@/lib/availability";
import { computeBookingPricing } from "@/lib/pricing";

const querySchema = z.object({
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.coerce.number().int().min(1),
});

/**
 * A read-only preview: tells the widget whether a date range/guest count
 * could be booked right now, and what it would cost, without creating (or
 * holding) a reservation. The actual booking creation endpoint re-validates
 * everything itself, since availability can change between this check and
 * that request.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    checkIn: searchParams.get("checkIn"),
    checkOut: searchParams.get("checkOut"),
    guests: searchParams.get("guests"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const checkIn = new Date(parsed.data.checkIn);
  const checkOut = new Date(parsed.data.checkOut);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json(
      { available: false, error: "Check-out date must be after check-in date" },
      { status: 200 },
    );
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkIn < today) {
    return NextResponse.json(
      { available: false, error: "Check-in date must be in the future" },
      { status: 200 },
    );
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      bookings: { where: blockingBookingWhere(), select: { checkIn: true, checkOut: true } },
    },
  });

  if (!listing || !listing.published) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (parsed.data.guests > listing.maxGuests) {
    return NextResponse.json(
      { available: false, error: `This listing sleeps up to ${listing.maxGuests} guests` },
      { status: 200 },
    );
  }
  if (!isRangeAvailable(checkIn, checkOut, listing.bookings)) {
    return NextResponse.json(
      { available: false, error: "Those dates are not available" },
      { status: 200 },
    );
  }

  const nights = nightsBetween(checkIn, checkOut);
  const pricing = computeBookingPricing({
    nights,
    pricePerNightCents: listing.pricePerNightCents,
    cleaningFeeCents: listing.cleaningFeeCents,
  });

  return NextResponse.json({ available: true, nights, pricing });
}

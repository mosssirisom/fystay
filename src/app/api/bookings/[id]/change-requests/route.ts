import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  blockingBookingWhere,
  blockingRanges,
  isRangeAvailable,
  nightsBetween,
} from "@/lib/availability";
import { canRequestBookingChange, computePriceDeltaCents } from "@/lib/changeRequests";

const createChangeRequestSchema = z.object({
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.number().int().min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createChangeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const checkIn = new Date(parsed.data.checkIn);
  const checkOut = new Date(parsed.data.checkOut);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: {
        include: {
          bookings: {
            where: blockingBookingWhere(),
            select: { id: true, checkIn: true, checkOut: true },
          },
          availabilityBlocks: { select: { startDate: true, endDate: true } },
        },
      },
      changeRequests: { where: { status: "PENDING" } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.guestId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canRequestBookingChange(booking, booking.changeRequests.length > 0)) {
    return NextResponse.json(
      { error: "This booking isn't eligible for a change request right now" },
      { status: 409 },
    );
  }
  if (parsed.data.guests > booking.listing.maxGuests) {
    return NextResponse.json(
      { error: `This listing sleeps up to ${booking.listing.maxGuests} guests` },
      { status: 400 },
    );
  }

  const otherBookedRanges = booking.listing.bookings.filter((b) => b.id !== booking.id);
  const merged = blockingRanges(otherBookedRanges, booking.listing.availabilityBlocks);
  if (!isRangeAvailable(checkIn, checkOut, merged)) {
    return NextResponse.json({ error: "Those dates are not available" }, { status: 409 });
  }

  const nights = nightsBetween(checkIn, checkOut);
  const priceDeltaCents = computePriceDeltaCents({
    requestedNights: nights,
    pricePerNightCents: booking.listing.pricePerNightCents,
    cleaningFeeCents: booking.cleaningFeeCents,
    currentTotalPriceCents: booking.totalPriceCents,
  });

  const changeRequest = await prisma.bookingChangeRequest.create({
    data: {
      bookingId: booking.id,
      requestedCheckIn: checkIn,
      requestedCheckOut: checkOut,
      requestedGuests: parsed.data.guests,
      priceDeltaCents,
      // Snapshotted now, since the booking itself gets overwritten once this
      // request is approved and applied - without this, "original vs new"
      // couldn't be shown accurately after the fact.
      originalCheckIn: booking.checkIn,
      originalCheckOut: booking.checkOut,
      originalGuests: booking.guests,
      originalTotalPriceCents: booking.totalPriceCents,
    },
  });

  return NextResponse.json({ changeRequest }, { status: 201 });
}

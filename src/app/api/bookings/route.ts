import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  blockingBookingWhere,
  blockingRanges,
  isRangeAvailable,
  nightsBetween,
} from "@/lib/availability";
import { computeBookingPricing } from "@/lib/pricing";
import { generateBookingReference } from "@/lib/bookingReference";
import { completePastBookings } from "@/lib/bookingLifecycle";

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

  await completePastBookings(prisma, session.user.id);

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
  if (checkOut <= checkIn) {
    return NextResponse.json(
      { error: "Check-out date must be after check-in date" },
      { status: 400 },
    );
  }
  // The calendar UI already disables past dates, but that's client-side
  // only, so enforce it here too, since this endpoint is reachable directly.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkIn < today) {
    return NextResponse.json({ error: "Check-in date must be in the future" }, { status: 400 });
  }

  const guestAccount = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  // Wrapped in a SERIALIZABLE transaction: two guests hitting "Continue to
  // checkout" for the same overlapping dates at the same instant must not
  // both pass the availability check before either has committed a row.
  // Postgres detects the conflict and aborts one side with a serialization
  // failure, which is caught below and turned into a normal 409.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const booking = await prisma.$transaction(
        async (tx) => {
          const listing = await tx.listing.findUnique({
            where: { id: listingId },
            include: {
              bookings: {
                where: blockingBookingWhere(),
                select: { checkIn: true, checkOut: true },
              },
              availabilityBlocks: {
                select: { startDate: true, endDate: true },
              },
            },
          });

          if (!listing || !listing.published) {
            throw new BookingRequestError(404, "Listing not found");
          }
          if (guests > listing.maxGuests) {
            throw new BookingRequestError(
              400,
              `This listing sleeps up to ${listing.maxGuests} guests`,
            );
          }
          if (
            !isRangeAvailable(
              checkIn,
              checkOut,
              blockingRanges(listing.bookings, listing.availabilityBlocks),
            )
          ) {
            throw new BookingRequestError(409, "Those dates are not available");
          }

          const nights = nightsBetween(checkIn, checkOut);
          const pricing = computeBookingPricing({
            nights,
            pricePerNightCents: listing.pricePerNightCents,
            cleaningFeeCents: listing.cleaningFeeCents,
          });

          return tx.booking.create({
            data: {
              reference: generateBookingReference(),
              listingId,
              guestId: session.user.id,
              checkIn,
              checkOut,
              guests,
              nights,
              nightlyPriceCents: listing.pricePerNightCents,
              cleaningFeeCents: pricing.cleaningFeeCents,
              serviceFeeCents: pricing.serviceFeeCents,
              taxCents: pricing.taxCents,
              totalPriceCents: pricing.totalPriceCents,
              guestName: guestAccount?.name,
              guestEmail: guestAccount?.email,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return NextResponse.json({ booking }, { status: 201 });
    } catch (error) {
      if (error instanceof BookingRequestError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      // P2002: the near-impossible reference collision. Retry with a freshly
      // generated one. P2034: a genuine serialization conflict with another
      // concurrent booking attempt for the same listing; also worth one
      // quiet retry, since the loser of the race may now see the dates as
      // taken (correct) rather than needing the guest to resubmit by hand.
      const isRetryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034");
      if (!isRetryable || attempt === 2) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
          return NextResponse.json(
            { error: "Those dates were just booked by someone else. Please try again." },
            { status: 409 },
          );
        }
        throw error;
      }
    }
  }

  return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
}

class BookingRequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

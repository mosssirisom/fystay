import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { blockingBookingWhere, blockingRanges, isRangeAvailable } from "@/lib/availability";
import { httpUrlSchema } from "@/lib/validation";

const createListingSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  city: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  address: z.string().max(200).optional(),
  pricePerNightCents: z.number().int().positive(),
  cleaningFeeCents: z.number().int().min(0).default(0),
  maxGuests: z.number().int().min(1).max(50),
  bedrooms: z.number().int().min(0).max(50),
  beds: z.number().int().min(1).max(50),
  bathrooms: z.number().int().min(0).max(50),
  photos: z.array(httpUrlSchema).min(1),
  amenities: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim();
  const guests = searchParams.get("guests");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");

  const listings = await prisma.listing.findMany({
    where: {
      published: true,
      ...(city
        ? {
            OR: [
              { city: { contains: city, mode: "insensitive" } },
              { country: { contains: city, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(guests ? { maxGuests: { gte: Number(guests) } } : {}),
      ...(minPrice ? { pricePerNightCents: { gte: Number(minPrice) } } : {}),
      ...(maxPrice ? { pricePerNightCents: { lte: Number(maxPrice) } } : {}),
    },
    include: {
      bookings: {
        where: blockingBookingWhere(),
        select: { checkIn: true, checkOut: true },
      },
      availabilityBlocks: {
        select: { startDate: true, endDate: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const checkIn = checkInParam ? new Date(checkInParam) : null;
  const checkOut = checkOutParam ? new Date(checkOutParam) : null;

  const filtered =
    checkIn && checkOut
      ? listings.filter((listing) =>
          isRangeAvailable(checkIn, checkOut, blockingRanges(listing.bookings, listing.availabilityBlocks)),
        )
      : listings;

  return NextResponse.json({ listings: filtered });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "HOST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const listing = await prisma.listing.create({
    data: { ...parsed.data, hostId: session.user.id },
  });

  return NextResponse.json({ listing }, { status: 201 });
}

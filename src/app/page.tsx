import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { isRangeAvailable } from "@/lib/availability";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard } from "@/components/ListingCard";

type SearchParams = Record<string, string | string[] | undefined>;

async function ListingsGrid({ searchParams }: { searchParams: SearchParams }) {
  const city = typeof searchParams.city === "string" ? searchParams.city : "";
  const guests = typeof searchParams.guests === "string" ? searchParams.guests : "";
  const checkInParam = typeof searchParams.checkIn === "string" ? searchParams.checkIn : "";
  const checkOutParam = typeof searchParams.checkOut === "string" ? searchParams.checkOut : "";

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
    },
    include: {
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        select: { checkIn: true, checkOut: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const checkIn = checkInParam ? new Date(checkInParam) : null;
  const checkOut = checkOutParam ? new Date(checkOutParam) : null;

  const filtered =
    checkIn && checkOut
      ? listings.filter((listing) => isRangeAvailable(checkIn, checkOut, listing.bookings))
      : listings;

  if (filtered.length === 0) {
    return (
      <p className="mt-16 text-center text-zinc-500">
        No listings match your search. Try different dates or destination.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {filtered.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <Suspense>
        <SearchBar />
      </Suspense>

      <div className="mt-10">
        <Suspense fallback={<p className="text-center text-zinc-500">Loading stays…</p>}>
          <ListingsGrid searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </div>
  );
}

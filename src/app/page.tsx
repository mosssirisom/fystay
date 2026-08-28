import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isRangeAvailable } from "@/lib/availability";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard } from "@/components/ListingCard";
import { ListingsGridSkeleton } from "@/components/ListingCardSkeleton";

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
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <SearchX className="h-8 w-8 text-zinc-300" />
        <p className="font-medium text-foreground">No stays match your search</p>
        <p className="max-w-sm text-sm text-zinc-500">
          Try different dates, a different destination, or fewer guests.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
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
      <h1 className="sr-only">Find places to stay on the Fylde coast</h1>
      <Suspense>
        <SearchBar />
      </Suspense>

      <div className="mt-10">
        <Suspense fallback={<ListingsGridSkeleton />}>
          <ListingsGrid searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { blockingBookingWhere, isRangeAvailable } from "@/lib/availability";
import { auth } from "@/auth";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard } from "@/components/ListingCard";
import { ListingsGridSkeleton } from "@/components/ListingCardSkeleton";
import { Badge } from "@/components/ui/Badge";

const FYLDE_COAST_AREAS = ["Blackpool", "Lytham St Annes", "Fleetwood", "Cleveleys", "Bispham"];

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// Search-filtered variations of the homepage (?city=, ?checkIn=, ...) all
// canonicalize to the bare URL so they consolidate into one indexed page.
export const metadata: Metadata = {
  alternates: { canonical: siteUrl },
};

type SearchParams = Record<string, string | string[] | undefined>;

async function ListingsGrid({ searchParams }: { searchParams: SearchParams }) {
  const city = typeof searchParams.city === "string" ? searchParams.city : "";
  const guests = typeof searchParams.guests === "string" ? searchParams.guests : "";
  const checkInParam = typeof searchParams.checkIn === "string" ? searchParams.checkIn : "";
  const checkOutParam = typeof searchParams.checkOut === "string" ? searchParams.checkOut : "";

  const [session, listings] = await Promise.all([
    auth(),
    prisma.listing.findMany({
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
          where: blockingBookingWhere(),
          select: { checkIn: true, checkOut: true },
        },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const savedListingIds = session?.user
    ? new Set(
        (
          await prisma.savedListing.findMany({
            where: { userId: session.user.id },
            select: { listingId: true },
          })
        ).map((s) => s.listingId),
      )
    : new Set<string>();

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
        <ListingCard
          key={listing.id}
          listing={listing}
          isSaved={savedListingIds.has(listing.id)}
          isLoggedIn={Boolean(session?.user)}
        />
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
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Stay local. Book with FY Stay.
        </h1>
        <p className="mt-2 text-sm text-zinc-500 sm:text-base">
          Discover independent accommodation across Blackpool and the Fylde Coast — a local
          alternative to the big booking platforms.
        </p>
      </div>
      <Suspense>
        <SearchBar />
      </Suspense>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Now covering
        </span>
        {FYLDE_COAST_AREAS.map((area) => (
          <Badge key={area} variant="neutral">
            {area}
          </Badge>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          Popular stays on the Fylde Coast
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Hand-picked local places to stay, ready to book today.
        </p>
        <div className="mt-6">
          <Suspense fallback={<ListingsGridSkeleton />}>
            <ListingsGrid searchParams={resolvedSearchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

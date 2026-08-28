import { Suspense } from "react";
import type { Metadata } from "next";
import { Lock, MapPin, SearchX, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { blockingBookingWhere, isRangeAvailable } from "@/lib/availability";
import { isPetFriendly, parseGuestParam, totalOccupants } from "@/lib/search";
import { auth } from "@/auth";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard } from "@/components/ListingCard";
import { ListingsCarouselSkeleton } from "@/components/ListingCardSkeleton";
import { Badge } from "@/components/ui/Badge";

const FYLDE_COAST_AREAS = ["Blackpool", "Lytham St Annes", "Fleetwood", "Cleveleys", "Bispham"];

const TRUST_POINTS = [
  {
    icon: MapPin,
    title: "Local Fylde Coast hosts",
    description: "Every stay is listed directly by a real local host, not resold from elsewhere.",
  },
  {
    icon: Star,
    title: "Genuine guest reviews",
    description: "Reviews can only be left by guests once they've completed a paid stay.",
  },
  {
    icon: Lock,
    title: "Secure payments",
    description: "Bookings are paid through Stripe's encrypted checkout, so we never see your card details.",
  },
];

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// Search-filtered variations of the homepage (?city=, ?checkIn=, ...) all
// canonicalize to the bare URL so they consolidate into one indexed page.
export const metadata: Metadata = {
  alternates: { canonical: siteUrl },
};

type SearchParams = Record<string, string | string[] | undefined>;

async function ListingsGrid({ searchParams }: { searchParams: SearchParams }) {
  const city = typeof searchParams.city === "string" ? searchParams.city : "";
  const checkInParam = typeof searchParams.checkIn === "string" ? searchParams.checkIn : "";
  const checkOutParam = typeof searchParams.checkOut === "string" ? searchParams.checkOut : "";
  const adults = parseGuestParam(searchParams.adults, 1);
  const children = parseGuestParam(searchParams.children, 0);
  const pets = parseGuestParam(searchParams.pets, 0);
  const guestsNeeded = totalOccupants({ adults, children });

  const [session, listings] = await Promise.all([
    auth(),
    prisma.listing.findMany({
      where: {
        published: true,
        maxGuests: { gte: guestsNeeded },
        ...(city
          ? {
              OR: [
                { city: { contains: city, mode: "insensitive" } },
                { country: { contains: city, mode: "insensitive" } },
              ],
            }
          : {}),
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

  const dateFiltered =
    checkIn && checkOut
      ? listings.filter((listing) => isRangeAvailable(checkIn, checkOut, listing.bookings))
      : listings;

  const filtered = pets > 0
    ? dateFiltered.filter((listing) => isPetFriendly(listing.amenities))
    : dateFiltered;

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
    <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {filtered.map((listing) => (
        <div
          key={listing.id}
          className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]"
        >
          <ListingCard
            listing={listing}
            isSaved={savedListingIds.has(listing.id)}
            isLoggedIn={Boolean(session?.user)}
          />
        </div>
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
          Discover independent accommodation across Blackpool and the Fylde Coast. A local
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
          <Suspense fallback={<ListingsCarouselSkeleton />}>
            <ListingsGrid searchParams={resolvedSearchParams} />
          </Suspense>
        </div>
      </div>

      <div className="mt-14 border-t border-border-subtle pt-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Why book with FY Stay?</h2>
          <p className="mt-1 text-sm text-zinc-500">
            A more personal, more local way to book a stay on the Fylde Coast.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

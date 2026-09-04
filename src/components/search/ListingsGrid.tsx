import { SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { blockingBookingWhere, blockingRanges, isRangeAvailable, nightsBetween } from "@/lib/availability";
import { isPetFriendly, parseGuestParam, totalOccupants } from "@/lib/search";
import { auth } from "@/auth";
import { ListingsCarousel } from "@/components/ListingsCarousel";
import { ListingCard } from "@/components/ListingCard";
import { FilterSheet } from "@/components/FilterSheet";
import { SortDropdown } from "@/components/SortDropdown";
import { ResultsViewToggle } from "@/components/ResultsViewToggle";
import { MapViewPlaceholder } from "@/components/MapViewPlaceholder";
import { ListingsMap } from "@/components/ListingsMap";
import {
  applyListingFilters,
  parseListingFiltersFromParams,
  parseSortParam,
  parseViewParam,
  sortListings,
} from "@/lib/listingSearch";
import { availableAmenityCategories } from "@/lib/amenityCategories";
import { PROPERTY_TYPES } from "@/lib/propertyType";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Shared between the homepage's "Popular stays" browse carousel
 * (showResultsView: false) and the dedicated /search results page
 * (showResultsView: true), so both stay backed by the same real query
 * instead of two parallel implementations drifting apart.
 */
export async function ListingsGrid({
  searchParams,
  showResultsView,
}: {
  searchParams: SearchParams;
  showResultsView: boolean;
}) {
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
        availabilityBlocks: {
          select: { startDate: true, endDate: true },
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
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : undefined;

  const dateFiltered =
    checkIn && checkOut
      ? listings.filter((listing) =>
          isRangeAvailable(checkIn, checkOut, blockingRanges(listing.bookings, listing.availabilityBlocks)),
        )
      : listings;

  const petFiltered = pets > 0
    ? dateFiltered.filter((listing) => isPetFriendly(listing.amenities))
    : dateFiltered;

  if (!showResultsView) {
    if (petFiltered.length === 0) {
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
      <ListingsCarousel
        listings={petFiltered}
        savedListingIds={savedListingIds}
        isLoggedIn={Boolean(session?.user)}
      />
    );
  }

  const availablePropertyTypes = PROPERTY_TYPES.filter((type) =>
    petFiltered.some((listing) => listing.propertyType === type),
  );
  const amenityCategories = availableAmenityCategories(petFiltered).map(({ key, label }) => ({
    key,
    label,
  }));

  const filters = parseListingFiltersFromParams(searchParams, PROPERTY_TYPES);
  const sort = parseSortParam(searchParams.sort);
  const view = parseViewParam(searchParams.view);

  const results = sortListings(applyListingFilters(petFiltered, filters), sort);

  const cityCounts = new Map<string, number>();
  for (const listing of results) {
    cityCounts.set(listing.city, (cityCounts.get(listing.city) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSheet
            availablePropertyTypes={availablePropertyTypes}
            availableAmenityCategories={amenityCategories}
          />
          <SortDropdown />
        </div>
        <ResultsViewToggle />
      </div>

      {results.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <SearchX className="h-8 w-8 text-zinc-300" />
          <p className="font-medium text-foreground">No stays match your search</p>
          <p className="max-w-sm text-sm text-zinc-500">
            Try different dates, a wider price range, or fewer filters.
          </p>
        </div>
      ) : view === "map" ? (
        (() => {
          // Every current town geocodes (see src/lib/geocoding.ts), so this
          // is only ever empty for a result set entirely outside FYStay's
          // actual coverage - the honest placeholder, not a broken-looking
          // empty map, is the right fallback for that.
          const mappable = results.filter(
            (l): l is typeof l & { latitude: number; longitude: number } =>
              l.latitude !== null && l.longitude !== null,
          );
          return mappable.length > 0 ? (
            <ListingsMap
              listings={mappable.map((l) => ({
                id: l.id,
                title: l.title,
                city: l.city,
                photo: l.photos[0] ?? null,
                pricePerNightCents: l.pricePerNightCents,
                latitude: l.latitude,
                longitude: l.longitude,
              }))}
            />
          ) : (
            <MapViewPlaceholder cityCounts={cityCounts} />
          );
        })()
      ) : (
        // Single column below sm: two half-width cards on a phone left
        // titles clipped and photos too small to judge a place by. One
        // full-width card per row is the same shape guests already get in
        // the homepage carousel. Tablet/desktop breakpoints (sm/lg) are
        // unchanged from before.
        <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
          {results.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isSaved={savedListingIds.has(listing.id)}
              isLoggedIn={Boolean(session?.user)}
              nights={nights}
            />
          ))}
        </div>
      )}
    </div>
  );
}

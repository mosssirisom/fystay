import { AlertTriangle, CalendarX, MapPin, SearchX, Users } from "lucide-react";
import { parseHotelSearchParams } from "@/lib/hotelSearchParams";
import { searchHotels } from "@/lib/hotelProviders/search";
import { HotelResultCard } from "@/components/hotels/HotelResultCard";

type SearchParams = Record<string, string | string[] | undefined>;

function StateMessage({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof SearchX;
  title: string;
  body: string;
}) {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 py-8 text-center">
      <Icon className="h-8 w-8 text-stone-300" aria-hidden />
      <p className="font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-stone-500">{body}</p>
    </div>
  );
}

/**
 * The one server component the /hotels search page renders its results
 * through - validates raw URL params, calls searchHotels() (the provider
 * abstraction's own orchestration layer, never an adapter directly - see
 * src/lib/hotelProviders/search.ts's own top comment), and renders every
 * state Phase 5 requires: an initial "nothing searched yet" prompt (not an
 * error - a guest landing on /hotels with no query hasn't done anything
 * wrong), invalid dates, invalid guest numbers, a provider error, empty
 * results, and the real result grid.
 */
export async function HotelSearchResults({ searchParams }: { searchParams: SearchParams }) {
  const hasAnyInput =
    typeof searchParams.destination === "string" && searchParams.destination.trim().length > 0;

  if (!hasAnyInput) {
    return (
      <StateMessage
        icon={MapPin}
        title="Search for a destination to see hotel deals"
        body="Enter where you're heading, pick your dates, and we'll show you hotels from our booking partners."
      />
    );
  }

  const parsed = parseHotelSearchParams(searchParams);
  if (!parsed.ok) {
    if (parsed.errors.dates) {
      return <StateMessage icon={CalendarX} title="Check your dates" body={parsed.errors.dates} />;
    }
    if (parsed.errors.guests) {
      return <StateMessage icon={Users} title="Check your guest numbers" body={parsed.errors.guests} />;
    }
    return (
      <StateMessage
        icon={AlertTriangle}
        title="Check your search"
        body={parsed.errors.destination ?? "Something about this search isn't valid."}
      />
    );
  }

  const outcome = await searchHotels(parsed.params);

  if (outcome.status === "unavailable") {
    return <StateMessage icon={AlertTriangle} title="Hotel search is unavailable" body={outcome.message} />;
  }

  if (outcome.results.length === 0) {
    return (
      <StateMessage
        icon={SearchX}
        title="No hotels found"
        body={`We couldn't find any hotels in "${parsed.params.destination}" for these dates. Try a different destination or dates.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="border-b border-border-subtle pb-4 text-sm font-medium text-stone-500">
        {outcome.results.length} hotel{outcome.results.length === 1 ? "" : "s"} found
      </p>
      <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
        {outcome.results.map((hotel) => (
          <HotelResultCard
            key={`${hotel.providerCode}:${hotel.externalId}`}
            hotel={hotel}
            searchParams={parsed.params}
          />
        ))}
      </div>
    </div>
  );
}

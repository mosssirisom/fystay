"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { parseGuestParam, type GuestCounts } from "@/lib/search";
import { GuestCategoryPicker } from "@/components/GuestCategoryPicker";
import { SearchDateRangeField } from "@/components/SearchDateRangeField";
import { DestinationAutocomplete } from "@/components/DestinationAutocomplete";

// How long to wait after the last change before auto-searching, so typing
// a city or clicking +/- on guests a few times in a row doesn't fire a
// request per keystroke/click.
const SEARCH_DEBOUNCE_MS = 350;

// A search always lands on the dedicated results page, matching how other
// booking sites separate the marketing homepage from search results.
const SEARCH_RESULTS_PATH = "/search";

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function buildSearchQuery(city: string, range: DateRange | undefined, guestCounts: GuestCounts): string {
  const params = new URLSearchParams();
  if (city) params.set("city", city);
  if (range?.from) params.set("checkIn", format(range.from, "yyyy-MM-dd"));
  if (range?.to) params.set("checkOut", format(range.to, "yyyy-MM-dd"));
  if (guestCounts.adults !== 1) params.set("adults", String(guestCounts.adults));
  if (guestCounts.children > 0) params.set("children", String(guestCounts.children));
  if (guestCounts.infants > 0) params.set("infants", String(guestCounts.infants));
  if (guestCounts.pets > 0) params.set("pets", String(guestCounts.pets));
  return params.toString();
}

export function SearchBar({ liveUpdate = true }: { liveUpdate?: boolean } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearching, startTransition] = useTransition();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  // Set only when the "Where" field's selection was a specific hotel/property
  // from the autocomplete dropdown, so Search can route straight to that
  // listing instead of a city-filtered results page. Any further free typing
  // clears it, since the field no longer reflects that exact selection.
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = parseDateParam(searchParams.get("checkIn"));
    const to = parseDateParam(searchParams.get("checkOut"));
    return from || to ? { from, to } : undefined;
  });
  const [guestCounts, setGuestCounts] = useState<GuestCounts>({
    adults: parseGuestParam(searchParams.get("adults") ?? undefined, 1) || 1,
    children: parseGuestParam(searchParams.get("children") ?? undefined, 0),
    infants: parseGuestParam(searchParams.get("infants") ?? undefined, 0),
    pets: parseGuestParam(searchParams.get("pets") ?? undefined, 0),
  });

  // On the results page, search live as fields change, debounced, so
  // results update without waiting for an explicit "Search" click - the
  // results grid's own Suspense fallback (a skeleton) is what shows the
  // "searching" state. On the homepage this is disabled (liveUpdate=false):
  // typing there shouldn't navigate away to the results page on every
  // keystroke, only an explicit Search press should. Also skipped while a
  // specific hotel/property is selected: the field holds that hotel's name
  // rather than a real city, so a city-filtered auto-search would find
  // nothing - Search instead routes straight to that listing.
  useEffect(() => {
    if (!liveUpdate || selectedListingId) return;

    const nextQuery = buildSearchQuery(city, range, guestCounts);
    if (nextQuery === searchParams.toString()) return;

    const timeout = setTimeout(() => {
      startTransition(() => {
        router.push(`${SEARCH_RESULTS_PATH}?${nextQuery}`, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router/searchParams/startTransition are stable
  }, [city, range, guestCounts, selectedListingId, liveUpdate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Guards against Enter-key resubmission in browsers that don't already
    // block implicit submission via a disabled submit button.
    if (isSearching) return;
    startTransition(() => {
      if (selectedListingId) {
        router.push(`/listings/${selectedListingId}`);
      } else {
        router.push(`${SEARCH_RESULTS_PATH}?${buildSearchQuery(city, range, guestCounts)}`);
      }
    });
  }

  function handleCityChange(next: string) {
    setCity(next);
    setSelectedListingId(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        // The outer shape carries most of the "premium" weight here: a
        // generous rounded card that flattens into a full pill once there's
        // room (sm+), a soft resting shadow that lifts on hover, and a
        // brand-teal focus ring when any field inside is focused - so the
        // whole bar reads as one cohesive, interactive surface rather than
        // four unrelated inputs sitting next to each other.
        "mx-auto flex w-full max-w-4xl flex-col gap-1 rounded-[28px] border border-border-subtle bg-surface p-2 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-popover)] focus-within:shadow-[var(--shadow-popover)] focus-within:ring-2 focus-within:ring-brand-600/25 sm:flex-row sm:items-stretch sm:gap-0 sm:rounded-full sm:p-2",
      )}
    >
      <div className="flex flex-1 flex-col divide-y divide-border-subtle sm:flex-row sm:divide-y-0 sm:divide-x sm:divide-border-subtle">
        <DestinationAutocomplete
          id="search-city"
          value={city}
          onChange={handleCityChange}
          onSelect={(payload) => {
            if (payload.type === "destination") {
              setCity(payload.city);
              setSelectedListingId(null);
            } else {
              setCity(payload.title);
              setSelectedListingId(payload.listingId);
            }
          }}
          className="sm:flex-[1.15]"
        />

        {/* Wider than the other segments: it holds two labelled sub-fields
            (Check-in/Check-out) rather than one. */}
        <SearchDateRangeField range={range} onChange={setRange} className="sm:flex-[1.6]" />

        <GuestCategoryPicker
          value={guestCounts}
          onChange={setGuestCounts}
          className="flex-1"
          // [&>svg]: recolors just this trigger's own icon to match the
          // teal used by the Where/Check-in fields, without touching
          // GuestCategoryPicker's markup - it's also used, unstyled, by the
          // listing page's booking widget, which this change shouldn't
          // affect at all.
          triggerClassName="px-3 py-2.5 sm:py-1.5 [&>svg]:text-brand-600"
        />
      </div>

      <button
        type="submit"
        disabled={isSearching}
        aria-busy={isSearching}
        className="focus-ring mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-800 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-90 disabled:active:scale-100 sm:mt-0 sm:ml-1 sm:w-auto sm:shrink-0 sm:py-3"
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Search className="h-4 w-4" aria-hidden />
        )}
        <span aria-live="polite">{isSearching ? "Searching…" : "Search"}</span>
      </button>
    </form>
  );
}

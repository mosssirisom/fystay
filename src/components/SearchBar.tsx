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

export function SearchBar() {
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

  // Search live as fields change, debounced, so results update without
  // waiting for an explicit "Search" click. The results grid's own Suspense
  // fallback (a skeleton) is what shows the "searching" state. Skipped while
  // a specific hotel/property is selected: the field holds that hotel's
  // name rather than a real city, so a city-filtered auto-search would find
  // nothing - Search instead routes straight to that listing.
  useEffect(() => {
    if (selectedListingId) return;

    const nextQuery = buildSearchQuery(city, range, guestCounts);
    if (nextQuery === searchParams.toString()) return;

    const timeout = setTimeout(() => {
      startTransition(() => {
        router.push(`/?${nextQuery}`, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router/searchParams/startTransition are stable
  }, [city, range, guestCounts, selectedListingId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Guards against Enter-key resubmission in browsers that don't already
    // block implicit submission via a disabled submit button.
    if (isSearching) return;
    startTransition(() => {
      if (selectedListingId) {
        router.push(`/listings/${selectedListingId}`);
      } else {
        router.push(`/?${buildSearchQuery(city, range, guestCounts)}`);
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
        "mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-2 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:gap-1.5 sm:rounded-full sm:p-1.5",
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
          className="flex-1"
        />

        <SearchDateRangeField range={range} onChange={setRange} className="flex-1" />

        <GuestCategoryPicker
          value={guestCounts}
          onChange={setGuestCounts}
          className="flex-1"
          triggerClassName="px-3 py-2.5 sm:py-1.5"
        />
      </div>

      <button
        type="submit"
        disabled={isSearching}
        aria-busy={isSearching}
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-90 sm:w-auto sm:shrink-0 sm:py-2.5"
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

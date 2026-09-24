"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { Loader2, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { buildHotelSearchQuery } from "@/lib/hotelSearchParams";
import { parseGuestParam } from "@/lib/search";
import { SearchDateRangeField } from "@/components/SearchDateRangeField";
import { HotelGuestRoomPicker, type HotelGuestCounts } from "@/components/hotels/HotelGuestRoomPicker";

const SEARCH_DEBOUNCE_MS = 350;
const HOTELS_PATH = "/hotels";

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * The hotel-search equivalent of SearchBar.tsx - same card shape, same
 * live-update-while-typing behavior on the results page, but its own
 * field set (destination text, dates, adults/children/rooms) since hotel
 * search has no FYStay-town autocomplete or infants/pets to offer.
 */
export function HotelSearchForm({ liveUpdate = true }: { liveUpdate?: boolean } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearching, startTransition] = useTransition();

  const [destination, setDestination] = useState(searchParams.get("destination") ?? "");
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = parseDateParam(searchParams.get("checkIn"));
    const to = parseDateParam(searchParams.get("checkOut"));
    return from || to ? { from, to } : undefined;
  });
  const [guestCounts, setGuestCounts] = useState<HotelGuestCounts>({
    adults: parseGuestParam(searchParams.get("adults") ?? undefined, 1) || 1,
    children: parseGuestParam(searchParams.get("children") ?? undefined, 0),
    rooms: parseGuestParam(searchParams.get("rooms") ?? undefined, 1) || 1,
  });

  function navigate() {
    const query = buildHotelSearchQuery({
      destination,
      checkIn: range?.from,
      checkOut: range?.to,
      adults: guestCounts.adults,
      children: guestCounts.children,
      rooms: guestCounts.rooms,
    });
    startTransition(() => {
      router.push(`${HOTELS_PATH}?${query}`, { scroll: false });
    });
  }

  // Live-updates on the results page as dates/guests change, debounced -
  // same pattern as SearchBar.tsx. Destination text is intentionally not
  // included here: typing a destination shouldn't fire a search on every
  // keystroke, only Search (or changing a date/guest field) should.
  useEffect(() => {
    if (!liveUpdate) return;
    const nextQuery = buildHotelSearchQuery({
      destination,
      checkIn: range?.from,
      checkOut: range?.to,
      adults: guestCounts.adults,
      children: guestCounts.children,
      rooms: guestCounts.rooms,
    });
    if (nextQuery === searchParams.toString()) return;

    const timeout = setTimeout(() => {
      startTransition(() => {
        router.push(`${HOTELS_PATH}?${nextQuery}`, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router/searchParams/startTransition are stable
  }, [range, guestCounts, liveUpdate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSearching) return;
    navigate();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto flex w-full max-w-4xl flex-col gap-1 rounded-2xl border border-border-subtle bg-surface p-2 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-popover)] focus-within:shadow-[var(--shadow-popover)] focus-within:ring-2 focus-within:ring-brand-600/25 sm:flex-row sm:items-stretch sm:gap-0 sm:p-2"
    >
      {isSearching && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl">
          <div className="search-sweep opacity-70" />
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col divide-y divide-border-subtle sm:flex-row sm:divide-y-0 sm:divide-x sm:divide-border-subtle">
        <div className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 sm:flex-[1.15] sm:py-1.5">
          <MapPin className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
          <label className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-foreground">Destination</span>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City, region or hotel"
              className="focus-ring -mx-1 w-full rounded px-1 text-sm text-foreground placeholder:text-stone-500 focus-visible:outline-offset-2"
            />
          </label>
        </div>

        <SearchDateRangeField range={range} onChange={setRange} className="sm:flex-[1.4]" />

        <HotelGuestRoomPicker
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
        className={cn(
          "relative z-10 mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-800 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-90 disabled:active:scale-100 sm:ml-1 sm:mt-0 sm:w-auto sm:shrink-0 sm:py-3 focus-ring",
        )}
      >
        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
        <span aria-live="polite">{isSearching ? "Searching…" : "Search hotels"}</span>
      </button>
    </form>
  );
}

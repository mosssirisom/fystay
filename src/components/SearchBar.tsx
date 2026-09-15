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

function buildSearchQuery(
  city: string,
  range: DateRange | undefined,
  guestCounts: GuestCounts,
  nearLandmark?: string | null,
): string {
  const params = new URLSearchParams();
  if (city) params.set("city", city);
  if (nearLandmark) params.set("near", nearLandmark);
  if (range?.from) params.set("checkIn", format(range.from, "yyyy-MM-dd"));
  if (range?.to) params.set("checkOut", format(range.to, "yyyy-MM-dd"));
  if (guestCounts.adults !== 1) params.set("adults", String(guestCounts.adults));
  if (guestCounts.children > 0) params.set("children", String(guestCounts.children));
  if (guestCounts.infants > 0) params.set("infants", String(guestCounts.infants));
  if (guestCounts.pets > 0) params.set("pets", String(guestCounts.pets));
  return params.toString();
}

export function SearchBar({
  liveUpdate = true,
  variant = "default",
}: {
  liveUpdate?: boolean;
  /**
   * "hero" is a smaller, translucent/frosted read of the exact same bar -
   * used only floating over the homepage hero video, where a full-size
   * opaque card would cover most of the footage behind it. "default" (the
   * /search page's own copy) is completely unchanged.
   */
  variant?: "default" | "hero";
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearching, startTransition] = useTransition();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  // Set only when the "Where" field's selection was a specific hotel/property
  // from the autocomplete dropdown, so Search can route straight to that
  // listing instead of a city-filtered results page. Any further free typing
  // clears it, since the field no longer reflects that exact selection.
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  // Set only when the "Where" field's selection was a specific named place
  // (e.g. "Blackpool Pleasure Beach") rather than a whole town - carries
  // through to the results page as ?near=, which scopes results to that
  // place's town and sorts them by real distance to it (see ListingsGrid
  // and listingSearch.ts's "distance_asc"). Cleared by any further typing,
  // same as selectedListingId, since the field no longer reflects it.
  const [nearLandmark, setNearLandmark] = useState<string | null>(searchParams.get("near"));
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

    const nextQuery = buildSearchQuery(city, range, guestCounts, nearLandmark);
    if (nextQuery === searchParams.toString()) return;

    const timeout = setTimeout(() => {
      startTransition(() => {
        router.push(`${SEARCH_RESULTS_PATH}?${nextQuery}`, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router/searchParams/startTransition are stable
  }, [city, range, guestCounts, selectedListingId, nearLandmark, liveUpdate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Guards against Enter-key resubmission in browsers that don't already
    // block implicit submission via a disabled submit button.
    if (isSearching) return;
    startTransition(() => {
      if (selectedListingId) {
        router.push(`/listings/${selectedListingId}`);
      } else {
        router.push(`${SEARCH_RESULTS_PATH}?${buildSearchQuery(city, range, guestCounts, nearLandmark)}`);
      }
    });
  }

  function handleCityChange(next: string) {
    setCity(next);
    setSelectedListingId(null);
    setNearLandmark(null);
  }

  const isHero = variant === "hero";

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
        "mx-auto flex w-full flex-col gap-1 rounded-[28px] border shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-popover)] focus-within:shadow-[var(--shadow-popover)] focus-within:ring-2 focus-within:ring-brand-600/25 sm:flex-row sm:items-stretch sm:gap-0 sm:rounded-full",
        isHero
          ? // Frosted glass rather than the solid card below: this is the
            // one instance of SearchBar that floats directly over the hero
            // video, so it needs to read as "part of the video" - small
            // and see-through - rather than a full-size opaque control
            // sitting on top of it. backdrop-blur keeps the text legible
            // over busy footage despite the low opacity. A genuinely
            // floating card - rounded on every corner, with margin on
            // every side (the wrapper's own padding in page.tsx, not just
            // its position) - so no edge or corner ever touches the
            // video's own frame, unlike the earlier full-bleed band this
            // replaced. gap-0.5 and tighter field padding (see
            // triggerClassName below) keep it compact without going back
            // to covering most of the footage.
            "w-full max-w-sm gap-0.5 rounded-2xl border-white/40 bg-white/35 p-1 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md sm:max-w-xl sm:p-1.5"
          : "max-w-4xl border-border-subtle bg-surface p-2 sm:p-2",
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
              setNearLandmark(null);
            } else if (payload.type === "landmark") {
              setCity(payload.town);
              setSelectedListingId(null);
              setNearLandmark(payload.name);
            } else {
              setCity(payload.title);
              setSelectedListingId(payload.listingId);
              setNearLandmark(null);
            }
          }}
          className="sm:flex-[1.15]"
          triggerClassName={isHero ? "px-2 py-1.5" : undefined}
        />

        {/* Wider than the other segments: it holds two labelled sub-fields
            (Check-in/Check-out) rather than one. */}
        <SearchDateRangeField
          range={range}
          onChange={setRange}
          className="sm:flex-[1.6]"
          triggerClassName={isHero ? "px-2 py-1.5" : undefined}
        />

        <GuestCategoryPicker
          value={guestCounts}
          onChange={setGuestCounts}
          requireDoneToConfirm
          className="flex-1"
          // [&>svg]: recolors just this trigger's own icon to match the
          // teal used by the Where/Check-in fields, without touching
          // GuestCategoryPicker's markup - it's also used, unstyled, by the
          // listing page's booking widget, which this change shouldn't
          // affect at all.
          triggerClassName={cn(
            "[&>svg]:text-brand-600",
            isHero ? "px-2 py-1.5" : "px-3 py-2.5 sm:py-1.5",
          )}
        />
      </div>

      <button
        type="submit"
        disabled={isSearching}
        aria-busy={isSearching}
        className={cn(
          "focus-ring flex w-full items-center justify-center gap-2 rounded-full font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-800 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-90 disabled:active:scale-100 sm:w-auto sm:shrink-0",
          isHero
            ? "bg-brand-700/90 px-4 py-1.5 text-xs sm:ml-1 sm:py-1.5"
            : "mt-1 bg-brand-700 px-6 py-3.5 text-sm sm:ml-1 sm:mt-0 sm:py-3",
        )}
      >
        {isSearching ? (
          <Loader2 className={cn("animate-spin", isHero ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
        ) : (
          <Search className={cn(isHero ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
        )}
        <span aria-live="polite">{isSearching ? "Searching…" : "Search"}</span>
      </button>
    </form>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { parseGuestParam, type GuestCounts } from "@/lib/search";
import { GuestCategoryPicker } from "@/components/GuestCategoryPicker";
import { SearchDateRangeField } from "@/components/SearchDateRangeField";

const fieldClasses =
  "focus-ring w-full rounded-lg bg-transparent px-0 py-0 text-sm text-foreground placeholder:text-zinc-500";

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (range?.from) params.set("checkIn", format(range.from, "yyyy-MM-dd"));
    if (range?.to) params.set("checkOut", format(range.to, "yyyy-MM-dd"));
    if (guestCounts.adults !== 1) params.set("adults", String(guestCounts.adults));
    if (guestCounts.children > 0) params.set("children", String(guestCounts.children));
    if (guestCounts.infants > 0) params.set("infants", String(guestCounts.infants));
    if (guestCounts.pets > 0) params.set("pets", String(guestCounts.pets));
    router.push(`/?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-2 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:gap-1.5 sm:rounded-full sm:p-1.5",
      )}
    >
      <div className="flex flex-1 flex-col divide-y divide-border-subtle sm:flex-row sm:divide-y-0 sm:divide-x sm:divide-border-subtle">
        <label
          htmlFor="search-city"
          className="flex flex-1 cursor-text items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-muted sm:py-1.5"
        >
          <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-foreground">Where</span>
            <input
              id="search-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search destinations"
              className={fieldClasses}
            />
          </span>
        </label>

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
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 sm:w-auto sm:shrink-0 sm:py-2.5"
      >
        <Search className="h-4 w-4" />
        Search
      </button>
    </form>
  );
}

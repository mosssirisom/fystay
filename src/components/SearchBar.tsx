"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { MapPin, Search, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const fieldClasses =
  "focus-ring w-full rounded-lg bg-transparent px-3 py-1.5 text-sm text-foreground placeholder:text-zinc-500";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") ?? "");
  const [guests, setGuests] = useState(searchParams.get("guests") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    router.push(`/?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-2 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:gap-0 sm:rounded-full",
      )}
    >
      <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-1 hover:bg-surface-muted sm:border-r sm:border-border-subtle">
        <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
        <div className="flex-1">
          <label htmlFor="search-city" className="block text-[11px] font-semibold text-foreground">
            Where
          </label>
          <input
            id="search-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search destinations"
            className={fieldClasses + " px-0 py-0"}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl px-3 py-1 hover:bg-surface-muted sm:border-r sm:border-border-subtle">
        <div>
          <label htmlFor="search-checkin" className="block text-[11px] font-semibold text-foreground">
            Check in
          </label>
          <input
            id="search-checkin"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className={fieldClasses + " px-0 py-0"}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl px-3 py-1 hover:bg-surface-muted sm:border-r sm:border-border-subtle">
        <div>
          <label htmlFor="search-checkout" className="block text-[11px] font-semibold text-foreground">
            Check out
          </label>
          <input
            id="search-checkout"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={fieldClasses + " px-0 py-0"}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl px-3 py-1 hover:bg-surface-muted">
        <Users className="h-4 w-4 shrink-0 text-zinc-400" />
        <div className="w-16">
          <label htmlFor="search-guests" className="block text-[11px] font-semibold text-foreground">
            Guests
          </label>
          <input
            id="search-guests"
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder="Add"
            className={fieldClasses + " px-0 py-0"}
          />
        </div>
      </div>

      <button
        type="submit"
        aria-label="Search"
        className="focus-ring flex items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 sm:ml-1"
      >
        <Search className="h-4 w-4" />
        <span className="sm:hidden" aria-hidden="true">Search</span>
      </button>
    </form>
  );
}

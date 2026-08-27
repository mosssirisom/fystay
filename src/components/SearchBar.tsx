"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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
      className="mx-auto flex w-full max-w-4xl flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-zinc-600">
        Where
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Search destinations"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
        Check in
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
        Check out
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
        />
      </label>
      <label className="flex w-24 flex-col gap-1 text-xs font-medium text-zinc-600">
        Guests
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder="1"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
        />
      </label>
      <button
        type="submit"
        className="rounded-full bg-rose-600 px-6 py-2 text-sm font-semibold text-white hover:bg-rose-700"
      >
        Search
      </button>
    </form>
  );
}

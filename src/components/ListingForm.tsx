"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ListingFormValues = {
  title: string;
  description: string;
  city: string;
  country: string;
  address: string;
  pricePerNight: string;
  maxGuests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  photos: string;
  amenities: string;
};

const emptyValues: ListingFormValues = {
  title: "",
  description: "",
  city: "",
  country: "",
  address: "",
  pricePerNight: "",
  maxGuests: "2",
  bedrooms: "1",
  beds: "1",
  bathrooms: "1",
  photos: "",
  amenities: "",
};

type Props = {
  listingId?: string;
  initialValues?: ListingFormValues;
};

export function ListingForm({ listingId, initialValues }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ListingFormValues>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      title: values.title,
      description: values.description,
      city: values.city,
      country: values.country,
      address: values.address || undefined,
      pricePerNightCents: Math.round(Number(values.pricePerNight) * 100),
      maxGuests: Number(values.maxGuests),
      bedrooms: Number(values.bedrooms),
      beds: Number(values.beds),
      bathrooms: Number(values.bathrooms),
      photos: values.photos
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean),
      amenities: values.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    };

    const res = await fetch(listingId ? `/api/listings/${listingId}` : "/api/listings", {
      method: listingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push("/host/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Title
        <input
          required
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Description
        <textarea
          required
          rows={5}
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          City
          <input
            required
            value={values.city}
            onChange={(e) => update("city", e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Country
          <input
            required
            value={values.country}
            onChange={(e) => update("country", e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Address (optional)
        <input
          value={values.address}
          onChange={(e) => update("address", e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Price / night ($)
          <input
            required
            type="number"
            min={1}
            step="0.01"
            value={values.pricePerNight}
            onChange={(e) => update("pricePerNight", e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Max guests
          <input
            required
            type="number"
            min={1}
            value={values.maxGuests}
            onChange={(e) => update("maxGuests", e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Bedrooms
          <input
            required
            type="number"
            min={0}
            value={values.bedrooms}
            onChange={(e) => update("bedrooms", e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Beds
          <input
            required
            type="number"
            min={1}
            value={values.beds}
            onChange={(e) => update("beds", e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Baths
          <input
            required
            type="number"
            min={0}
            value={values.bathrooms}
            onChange={(e) => update("bathrooms", e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Photo URLs (one per line)
        <textarea
          required
          rows={3}
          value={values.photos}
          onChange={(e) => update("photos", e.target.value)}
          placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
          className="rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs focus:border-rose-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Amenities (comma separated)
        <input
          value={values.amenities}
          onChange={(e) => update("amenities", e.target.value)}
          placeholder="Wifi, Kitchen, Free parking"
          className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 self-start rounded-full bg-rose-600 px-6 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {loading ? "Saving…" : listingId ? "Save changes" : "Create listing"}
      </button>
    </form>
  );
}

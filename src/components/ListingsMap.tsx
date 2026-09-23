"use client";

import dynamic from "next/dynamic";
import type { MapListing } from "@/components/ListingsMapInner";

// Leaflet touches `window` as soon as its module evaluates, so it can only
// ever run client-side - `ssr: false` needs a Client Component boundary to
// call it from at all, which is the only reason this thin wrapper exists
// separately from ListingsMapInner itself.
const ListingsMapInner = dynamic(
  () => import("@/components/ListingsMapInner").then((m) => m.ListingsMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="skeleton-shimmer flex h-[480px] w-full items-center justify-center rounded-2xl">
        <p className="text-sm text-stone-500">Loading map…</p>
      </div>
    ),
  },
);

export function ListingsMap({ listings }: { listings: MapListing[] }) {
  return <ListingsMapInner listings={listings} />;
}

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
      <div className="flex h-[480px] w-full animate-pulse items-center justify-center rounded-2xl bg-surface-muted">
        <p className="text-sm text-zinc-400">Loading map…</p>
      </div>
    ),
  },
);

export function ListingsMap({ listings }: { listings: MapListing[] }) {
  return <ListingsMapInner listings={listings} />;
}

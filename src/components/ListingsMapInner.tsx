"use client";

import Image from "next/image";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatPrice } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image";
import { fyldeCoastCenter } from "@/lib/geocoding";

export type MapListing = {
  id: string;
  title: string;
  city: string;
  photo: string | null;
  pricePerNightCents: number;
  latitude: number;
  longitude: number;
};

/**
 * A price-pill marker (matching how Airbnb's own map reads at a glance)
 * rather than Leaflet's default pin: an L.divIcon rendering plain HTML,
 * since Leaflet's own icon system predates React and isn't a place
 * components can render into directly - only the popup content below is
 * real React.
 */
function priceIcon(pricePerNightCents: number) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background: var(--color-brand-700, #0f766e);
      color: white;
      font-weight: 600;
      font-size: 12.5px;
      padding: 5px 10px;
      border-radius: 999px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.35);
      white-space: nowrap;
      font-family: inherit;
    ">${formatPrice(pricePerNightCents)}</div>`,
    iconSize: undefined,
    iconAnchor: [30, 15],
  });
}

export function ListingsMapInner({ listings }: { listings: MapListing[] }) {
  const center =
    listings.length > 0
      ? { latitude: listings[0].latitude, longitude: listings[0].longitude }
      : fyldeCoastCenter();
  const bounds: [number, number][] = listings.map((l) => [l.latitude, l.longitude]);

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={12}
      bounds={bounds.length > 1 ? bounds : undefined}
      boundsOptions={{ padding: [40, 40] }}
      scrollWheelZoom={false}
      className="h-[480px] w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.latitude, listing.longitude]}
          icon={priceIcon(listing.pricePerNightCents)}
        >
          <Popup minWidth={200}>
            <Link href={`/listings/${listing.id}`} className="flex flex-col gap-2 no-underline">
              <div className="relative h-24 w-full overflow-hidden rounded-lg bg-surface-muted">
                {listing.photo && (
                  <Image
                    src={listing.photo}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="200px"
                    unoptimized={!isOptimizableImage(listing.photo)}
                  />
                )}
              </div>
              <div>
                <p className="truncate text-sm font-semibold text-foreground">{listing.title}</p>
                <p className="text-xs text-zinc-500">{listing.city}</p>
                <p className="mt-1 text-sm font-bold text-brand-800">
                  {formatPrice(listing.pricePerNightCents)}
                  <span className="text-xs font-normal text-zinc-500"> / night</span>
                </p>
              </div>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image";

export type ListingCardData = {
  id: string;
  title: string;
  city: string;
  country: string;
  pricePerNightCents: number;
  photos: string[];
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="focus-ring group flex flex-col gap-2 rounded-2xl"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface-muted">
        {listing.photos[0] ? (
          <Image
            src={listing.photos[0]}
            alt={listing.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized={!isOptimizableImage(listing.photos[0])}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
      </div>
      <div>
        <p className="truncate font-medium text-foreground">{listing.title}</p>
        <p className="truncate text-sm text-zinc-500">
          {listing.city}, {listing.country}
        </p>
        <p className="mt-1 text-sm text-foreground">
          <span className="font-semibold">{formatPrice(listing.pricePerNightCents)}</span>{" "}
          <span className="text-zinc-500">night</span>
        </p>
      </div>
    </Link>
  );
}

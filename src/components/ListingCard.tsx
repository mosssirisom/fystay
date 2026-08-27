import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

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
      className="group flex flex-col gap-2 rounded-xl"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100">
        {listing.photos[0] ? (
          <Image
            src={listing.photos[0]}
            alt={listing.title}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            No photo
          </div>
        )}
      </div>
      <div>
        <p className="truncate font-medium text-zinc-900">{listing.title}</p>
        <p className="truncate text-sm text-zinc-500">
          {listing.city}, {listing.country}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">{formatPrice(listing.pricePerNightCents)}</span>{" "}
          <span className="text-zinc-500">night</span>
        </p>
      </div>
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ImageOff, Star } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image";
import { SaveButton } from "@/components/SaveButton";

export type ListingCardData = {
  id: string;
  title: string;
  city: string;
  country: string;
  pricePerNightCents: number;
  photos: string[];
  reviews: { rating: number }[];
};

export function ListingCard({
  listing,
  isSaved = false,
  isLoggedIn = false,
}: {
  listing: ListingCardData;
  isSaved?: boolean;
  isLoggedIn?: boolean;
}) {
  const averageRating =
    listing.reviews.length > 0
      ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length
      : null;

  return (
    <div className="group flex flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface-muted">
        <Link
          href={`/listings/${listing.id}`}
          className="focus-ring absolute inset-0 block rounded-2xl"
        >
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
        </Link>
        <SaveButton
          listingId={listing.id}
          initialSaved={isSaved}
          isLoggedIn={isLoggedIn}
          className="absolute right-2 top-2 z-10"
        />
      </div>
      <Link href={`/listings/${listing.id}`} className="focus-ring rounded-xl">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-medium text-foreground">{listing.title}</p>
          {averageRating !== null && (
            <span className="flex shrink-0 items-center gap-1 text-sm text-foreground">
              <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
              {averageRating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="truncate text-sm text-zinc-500">
          {listing.city}, {listing.country}
        </p>
        <p className="mt-1 text-sm text-foreground">
          <span className="font-semibold">{formatPrice(listing.pricePerNightCents)}</span>{" "}
          <span className="text-zinc-500">night</span>
        </p>
      </Link>
    </div>
  );
}

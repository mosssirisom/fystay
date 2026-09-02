import Image from "next/image";
import Link from "next/link";
import { ImageOff, MapPin, Star } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image";
import { SaveButton } from "@/components/SaveButton";
import { averageRating as computeAverageRating } from "@/lib/reviews";
import { AMENITY_CATEGORIES } from "@/lib/amenityCategories";
import { withCity } from "@/lib/seo";

export type ListingCardData = {
  id: string;
  title: string;
  city: string;
  country: string;
  pricePerNightCents: number;
  photos: string[];
  amenities: string[];
  reviews: { rating: number }[];
};

const MAX_AMENITY_ICONS = 3;

export function ListingCard({
  listing,
  isSaved = false,
  isLoggedIn = false,
}: {
  listing: ListingCardData;
  isSaved?: boolean;
  isLoggedIn?: boolean;
}) {
  const rating = computeAverageRating(listing.reviews);
  const reviewCount = listing.reviews.length;
  const keyAmenities = AMENITY_CATEGORIES.filter((category) =>
    category.test(listing.amenities),
  ).slice(0, MAX_AMENITY_ICONS);

  return (
    // The lift-on-hover applies to the whole card (image and text together)
    // rather than just zooming the photo - a plain `hover:` here, not
    // `group-hover:`, since :hover already bubbles up to this element from
    // either Link inside it. transition-transform is separate from the
    // image's own transition so the two don't fight over timing.
    <div className="group flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1 focus-within:-translate-y-1">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-brand-50 shadow-[var(--shadow-card)] ring-1 ring-black/5 transition-shadow duration-300 group-hover:shadow-[var(--shadow-card-hover)] group-hover:ring-brand-200">
        <Link
          href={`/listings/${listing.id}`}
          className="focus-ring absolute inset-0 block rounded-2xl"
        >
          {listing.photos[0] ? (
            <Image
              src={listing.photos[0]}
              alt={withCity(listing.title, listing.city)}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized={!isOptimizableImage(listing.photos[0])}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-brand-300">
              <ImageOff className="h-6 w-6" />
              <span className="text-xs font-medium text-brand-400">Photo coming soon</span>
            </div>
          )}
        </Link>
        <SaveButton
          listingId={listing.id}
          initialSaved={isSaved}
          isLoggedIn={isLoggedIn}
          className="absolute right-2.5 top-2.5 z-10 h-10 w-10 bg-white/80 shadow-[var(--shadow-card)] backdrop-blur-sm hover:bg-white active:scale-90"
        />
      </div>
      <Link href={`/listings/${listing.id}`} className="focus-ring flex flex-col gap-1.5 rounded-xl">
        {/* min-h keeps this row the same height whether the title wraps to
            one line or two, so price/rating rows still line up across a
            row of cards regardless of title length. */}
        <p
          data-testid="listing-card-title"
          className="line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-brand-800"
        >
          {listing.title}
        </p>
        <p className="flex items-center gap-1 text-sm text-zinc-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
          <span className="truncate">
            {listing.city}, {listing.country}
          </span>
        </p>
        {keyAmenities.length > 0 && (
          <ul className="flex items-center gap-2.5">
            {keyAmenities.map((category) => (
              <li key={category.key} className="flex items-center gap-1 text-xs text-zinc-500">
                <category.icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">{category.label}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="flex items-baseline gap-1">
            <span className="text-base font-bold text-brand-800">
              {formatPrice(listing.pricePerNightCents)}
            </span>
            <span className="text-xs text-zinc-500">/ night</span>
          </p>
          {rating !== null && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-600">
              <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
              {rating.toFixed(1)}
              {reviewCount > 0 && <span className="text-zinc-500">({reviewCount})</span>}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

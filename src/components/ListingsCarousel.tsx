import { ListingCard, type ListingCardData } from "@/components/ListingCard";

export function ListingsCarousel({
  listings,
  savedListingIds,
  isLoggedIn,
}: {
  listings: ListingCardData[];
  savedListingIds: Set<string>;
  isLoggedIn: boolean;
}) {
  return (
    <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {listings.map((listing) => (
        <div key={listing.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
          <ListingCard
            listing={listing}
            isSaved={savedListingIds.has(listing.id)}
            isLoggedIn={isLoggedIn}
          />
        </div>
      ))}
    </div>
  );
}

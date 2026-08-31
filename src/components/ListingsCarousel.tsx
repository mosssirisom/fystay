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
    // Mobile browsers compute their initial page-fit viewport width from the
    // *intrinsic* (unscrolled) width of in-flow content, ignoring
    // overflow-x/contain properties entirely - a flex row wide enough to
    // need scrolling was making the whole page's viewport a few dozen
    // pixels wider than the screen, letting a swipe pan into genuinely
    // blank space past the real content (confirmed with a synthesized
    // touch-drag screenshot, and by bisecting down to this exact row).
    // Taking the scrolling row out of normal flow with position: absolute
    // is what actually stops that: an out-of-flow element's content size
    // never contributes to a page-fit calculation the way an in-flow one
    // does. The invisible row behind it exists purely to give this
    // relative wrapper a real height, sized off one real card so it can
    // never drift out of sync with the actual card layout.
    <div className="relative w-full">
      <div className="invisible flex gap-6 pb-2">
        <div className="w-[46%] shrink-0 sm:w-[31%] lg:w-[23%]">
          <ListingCard listing={listings[0]} isLoggedIn={isLoggedIn} />
        </div>
      </div>
      <div className="absolute inset-x-0 top-0 flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
    </div>
  );
}

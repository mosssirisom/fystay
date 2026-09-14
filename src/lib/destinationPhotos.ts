/**
 * Real, licensed photography for the handful of towns that have it, keyed
 * by the same slug as FYLDE_COAST_DESTINATIONS. A town with no entry here
 * falls back to the generated art (TownHeroArt) - never a hotlinked or
 * unlicensed stock photo standing in for a town FYStay hasn't actually
 * been supplied a real photo of.
 *
 * `hero` backs the /destinations/[slug] page's full-bleed banner
 * (TownHero); `tile` backs the smaller "Explore the Fylde Coast" homepage
 * card (ExploreDestinations) - deliberately separate fields since a wide
 * establishing shot that works as a banner can crop badly into a 4:3 tile,
 * and vice versa. Where only one real photo exists for a town, both point
 * at it; that's a placeholder-photo-parity trade-off, not a bug.
 */
export const DESTINATION_PHOTOS: Partial<Record<string, { hero: string; tile: string }>> = {
  blackpool: {
    hero: "/images/destinations/blackpool-hero.jpg",
    tile: "/images/destinations/blackpool-tile.jpg",
  },
  "lytham-st-annes": {
    hero: "/images/destinations/lytham-st-annes.jpg",
    tile: "/images/destinations/lytham-st-annes.jpg",
  },
  cleveleys: {
    hero: "/images/destinations/cleveleys.jpg",
    tile: "/images/destinations/cleveleys.jpg",
  },
};

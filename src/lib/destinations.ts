/**
 * The Fylde Coast towns FYStay covers - the same set as the homepage's
 * "Now covering" badges, but structured for reuse: today it backs the
 * homepage's "Explore the Fylde Coast" tiles, and is meant to double as the
 * data source for dedicated per-destination landing pages later (e.g.
 * /destinations/blackpool, targeting searches like "accommodation in
 * Blackpool") without having to re-derive this list. `searchCity` is the
 * exact `city` value used elsewhere (seed data, search filtering) so a tile
 * genuinely filters to that town's listings today, not a placeholder link.
 */
export type FyldeCoastDestination = {
  slug: string;
  name: string;
  /** Short, factual description - written for reuse as a future landing page's intro/meta description, not shown on the homepage tile itself. */
  description: string;
  searchCity: string;
};

export const FYLDE_COAST_DESTINATIONS: FyldeCoastDestination[] = [
  {
    slug: "blackpool",
    name: "Blackpool",
    description:
      "Home to Blackpool Tower, the Pleasure Beach and the Illuminations - the Fylde Coast's best-known seaside resort.",
    searchCity: "Blackpool",
  },
  {
    slug: "lytham-st-annes",
    name: "Lytham St Annes",
    description:
      "A quieter stretch of coast with a windmill green, sand dunes and a traditional pier.",
    searchCity: "Lytham St Annes",
  },
  {
    slug: "cleveleys",
    name: "Cleveleys",
    description: "Open beaches and a laid-back seafront just north of Blackpool.",
    searchCity: "Cleveleys",
  },
  {
    slug: "fleetwood",
    name: "Fleetwood",
    description:
      "A historic fishing port at the tip of the coast, with a tram link straight down to Blackpool.",
    searchCity: "Fleetwood",
  },
  {
    slug: "bispham",
    name: "Bispham",
    description: "Clifftop gardens and coastal views between Blackpool and Cleveleys.",
    searchCity: "Bispham",
  },
];

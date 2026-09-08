/**
 * Content for each town's premium hero section - a short, editorial
 * introduction plus a handful of "Perfect for" tags. Every line here is
 * grounded in what the rest of the Local Guide already establishes about
 * that town (see each town's `insiderTip` and category entries in
 * localGuide.ts) rather than new claims invented just for the hero, so a
 * guest who reads on never finds the hero oversold what the guide actually
 * delivers.
 */

export type TownHeroContent = {
  intro: string;
  perfectFor: string[];
};

export const TOWN_HERO_CONTENT: Record<string, TownHeroContent> = {
  blackpool: {
    intro:
      "The Fylde Coast's biggest seaside resort - the Tower, the Pleasure Beach and three miles of Promenade, all a tram ride apart. Come for the rides and the Illuminations; stay for a proper British seaside holiday.",
    perfectFor: ["Big family days out", "Classic seaside fun", "Nightlife", "Thrill rides"],
  },
  "lytham-st-annes": {
    intro:
      "A quieter, more grown-up stretch of coast - a windmill on the green, a championship golf course, and a sunset over the Ribble estuary most visitors never stay long enough to see.",
    perfectFor: ["Relaxed coastal walks", "Golf & fine dining", "Quiet family days", "Sunset views"],
  },
  cleveleys: {
    intro:
      "What Blackpool's seafront would look like without the crowds - a redesigned promenade, open lawns and a long, flat beach, a short tram ride from everything Blackpool offers.",
    perfectFor: ["Quiet beach days", "Easy flat walks", "Away from the crowds", "Family-friendly"],
  },
  fleetwood: {
    intro:
      "A working fishing port at the very tip of the coast - a historic market, two lighthouses and a ferry across the Wyre estuary. A genuinely different day out, just a tram ride from Blackpool.",
    perfectFor: ["Historic market town", "Lighthouses & the ferry", "Fresh local produce", "A different day out"],
  },
  bispham: {
    intro:
      "Blackpool's attractions without Blackpool's noise - clifftop gardens and coastal views a few minutes' tram ride from the Tower, then home to somewhere genuinely peaceful.",
    perfectFor: ["Clifftop views", "A quiet base near Blackpool", "Peaceful walks", "Easy tram access"],
  },
};

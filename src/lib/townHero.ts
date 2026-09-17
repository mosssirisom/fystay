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
  lytham: {
    intro:
      "A quieter, more grown-up town on the estuary - a windmill on the green, a Georgian hall inland, and a sunset over the Ribble most visitors never stay long enough to see.",
    perfectFor: ["Relaxed coastal walks", "Golf & fine dining", "Quiet family days", "Sunset views"],
  },
  "st-annes": {
    intro:
      "A Victorian pier, wide dune beaches and a formal Victorian park in Ashton Gardens - St Annes' own stretch of coast, a short walk from Lytham but a different town entirely.",
    perfectFor: ["Family beach days", "Pier & promenade", "Formal gardens", "Quiet dune walks"],
  },
  "poulton-le-fylde": {
    intro:
      "No seafront here - a working market square, an 11th-century church and the coast's own rail interchange instead. The best-connected base on the Fylde, fifteen minutes from the sea whenever you want it.",
    perfectFor: ["A quiet, well-connected base", "Market days", "Country walks", "Easy rail travel"],
  },
  fleetwood: {
    intro:
      "A working fishing port at the very tip of the coast - a historic market, two lighthouses and a ferry across the Wyre estuary. A genuinely different day out, just a tram ride from Blackpool.",
    perfectFor: ["Historic market town", "Lighthouses & the ferry", "Fresh local produce", "A different day out"],
  },
  "thornton-cleveleys": {
    intro:
      "Cleveleys' open, redesigned seafront without Blackpool's crowds, and Thornton's 18th-century windmill village a short walk inland - two very different halves of one coastal town.",
    perfectFor: ["Quiet beach days", "Easy flat walks", "A working windmill", "Family-friendly"],
  },
};

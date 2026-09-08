import {
  Clock,
  CircleParkingOff,
  Footprints,
  Gem,
  Signpost,
  Sunset,
  Volume1,
  Waves,
  type LucideIcon,
} from "lucide-react";

/**
 * ============================================================================
 * EDITORIAL CONTENT - HUMAN REVIEW NEEDED BEFORE THIS SHIPS TO PRODUCTION
 * ============================================================================
 * Same status as src/lib/localGuide.ts, and if anything higher-risk: this
 * content is deliberately more specific than the main guide (exact car
 * parks to avoid, exact timing windows, exact sunset spots), because that
 * specificity is the entire point of a "local knowledge" section - but it
 * also means it's harder to get right from general knowledge alone. It was
 * written from real, stable facts about each town (geography, which
 * direction the coast faces, which attractions exist) reasoned into
 * specific advice, not from live, current, ground-level knowledge of - for
 * instance - which exact car park fills up first this season. Someone who
 * actually knows the current Fylde Coast should read every entry here
 * before it's presented as verified local knowledge rather than a
 * well-reasoned first draft.
 * ============================================================================
 */

export type LocalKnowledgeCategoryKey =
  | "whereLocalsGo"
  | "parkingToAvoid"
  | "bestTimes"
  | "familyBeaches"
  | "sunsetSpots"
  | "quietAlternatives"
  | "shortcuts"
  | "hiddenGem";

export type LocalKnowledgeEntry = {
  headline: string;
  body: string;
  /** Key into src/lib/placeCoordinates.ts, set only when this entry centres on one real, singular, identifiable place. */
  place?: string;
};

export type TownLocalKnowledge = Record<LocalKnowledgeCategoryKey, LocalKnowledgeEntry>;

export const LOCAL_KNOWLEDGE_CATEGORIES: { key: LocalKnowledgeCategoryKey; label: string; icon: LucideIcon }[] = [
  { key: "whereLocalsGo", label: "Where locals actually go", icon: Footprints },
  { key: "parkingToAvoid", label: "Areas to avoid for parking", icon: CircleParkingOff },
  { key: "bestTimes", label: "Best times to visit", icon: Clock },
  { key: "familyBeaches", label: "Best beaches for families", icon: Waves },
  { key: "sunsetSpots", label: "Best sunset spots", icon: Sunset },
  { key: "quietAlternatives", label: "Quiet alternatives to busy attractions", icon: Volume1 },
  { key: "shortcuts", label: "Local shortcuts & tips", icon: Signpost },
  { key: "hiddenGem", label: "Hidden gem", icon: Gem },
];

export const LOCAL_KNOWLEDGE: Record<string, TownLocalKnowledge> = {
  blackpool: {
    whereLocalsGo: {
      headline: "Church Street, not the Golden Mile",
      body: "Ask someone from Blackpool where they actually eat and drink, and they'll send you inland to Church Street and the streets around it - not the seafront, which is built for visitors rather than regulars.",
    },
    parkingToAvoid: {
      headline: "Skip the car parks right under the Tower",
      body: "The Promenade car parks nearest the Tower fill first and clear last, especially on Illuminations nights. The multi-storey near Houndshill Shopping Centre empties out faster and is only a five-minute walk from the seafront.",
      place: "Houndshill Shopping Centre",
    },
    bestTimes: {
      headline: "First and last hour beat the midday crush",
      body: "Pleasure Beach and the Tower are both quietest in the first two hours after opening and the last hour before close. Crowds peak between midday and mid-afternoon, worse still in school holidays.",
    },
    familyBeaches: {
      headline: "Head towards Norbreck for more room",
      body: "The stretch of beach near Norbreck and North Shore is flatter and considerably less crowded than the central beach directly outside the Tower - an easier walk down for anyone managing young kids and beach gear.",
    },
    sunsetSpots: {
      headline: "Bispham's stretch of Promenade, minus the crowds",
      body: "Blackpool faces west, so any point on the Promenade catches the sunset over the Irish Sea. The quieter northern stretch near Bispham gets the same view as the crowded central section, with far fewer people in the way of the photo.",
    },
    quietAlternatives: {
      headline: "Sandcastle Waterpark over Pleasure Beach's queues",
      body: "If Pleasure Beach's queues aren't for you, Sandcastle Waterpark next door is usually far calmer outside summer weekends, with a similar big-ride thrill and none of the standing around.",
      place: "Sandcastle Waterpark",
    },
    shortcuts: {
      headline: "The tram beats driving the seafront in summer",
      body: "A tram day ticket is often cheaper than paying for parking twice, and it's reliably faster than driving the Promenade in summer traffic. Walking the seafront end to end is a different experience before 10am, once the day-trippers have arrived.",
    },
    hiddenGem: {
      headline: "The Grundy Art Gallery, two minutes off Queen Street",
      body: "Free to enter and almost always quiet, the Grundy sits a short walk inland from the Golden Mile - a proper change of pace from the seafront that most visitors never realise is there.",
      place: "Grundy Art Gallery",
    },
  },

  "lytham-st-annes": {
    whereLocalsGo: {
      headline: "Clifton Street and Henry Street, not the seafront hotels",
      body: "Locals in Lytham drink and eat around Clifton Street and Henry Street, a five-minute walk from the green - a genuinely different atmosphere from the seafront hotels most visitors default to.",
    },
    parkingToAvoid: {
      headline: "The green's own car park fills first",
      body: "Parking directly on Lytham Green fills quickly on any dry weekend. The streets just south of Clifton Street usually still have space, and it's actually a shorter walk to the shops from there.",
    },
    bestTimes: {
      headline: "Fairhaven Lake before 10am",
      body: "Fairhaven Lake fills with families from late morning onwards. Arrive before 10am if you want the model boats and the paths around the water to yourselves.",
      place: "Fairhaven Lake",
    },
    familyBeaches: {
      headline: "St Annes' dunes over Lytham's own stretch",
      body: "St Annes beach, particularly towards the dunes, is flatter and quieter than the stretch of coast right by Lytham itself near the estuary - better for younger kids who want space to actually run around.",
    },
    sunsetSpots: {
      headline: "The windmill end of Lytham Green",
      body: "Lytham Green faces west over the Ribble estuary, and the view from beside the windmill at sunset is, without much competition, the best on this stretch of coast. Most visitors leave before dinner and never see it.",
    },
    quietAlternatives: {
      headline: "Fairhaven Lake and Ashton Gardens during tournament weeks",
      body: "When Royal Lytham & St Annes hosts a major tournament, the town centre gets genuinely busy. Fairhaven Lake and Ashton Gardens, both a short walk away, rarely feel it.",
    },
    shortcuts: {
      headline: "Walk the green instead of driving between the two towns",
      body: "Lytham and St Annes are connected by a flat, mostly traffic-free walk along the green and coastal path - about 25 minutes, and usually quicker than driving and parking twice.",
    },
    hiddenGem: {
      headline: "Ashton Gardens' lake and aviary",
      body: "A proper formal park with its own lake and aviary, two minutes off the St Annes seafront, that most day-trippers heading straight for the beach never find.",
      place: "Ashton Gardens",
    },
  },

  cleveleys: {
    whereLocalsGo: {
      headline: "Victoria Road West is the real high street",
      body: "Cleveleys locals treat Victoria Road West as their high street, not the Promenade - it's where the cafés and shops used day-to-day actually are, rather than the seafront aimed at passing visitors.",
    },
    parkingToAvoid: {
      headline: "The seafront car parks by Jubilee Gardens",
      body: "The car parks closest to Jubilee Gardens fill first on sunny days. Parking a few streets back off Victoria Road West is usually easier and only adds a couple of minutes to the walk.",
      place: "Jubilee Gardens Cleveleys",
    },
    bestTimes: {
      headline: "Anchorsholme's splash park at opening time",
      body: "Anchorsholme Park's splash park is at its busiest early-to-mid-afternoon on hot days. Arriving when it opens is the difference between a five-minute wait and none at all.",
      place: "Anchorsholme Park",
    },
    familyBeaches: {
      headline: "The stretch near Anchorsholme Park",
      body: "Cleveleys' beach is flatter and considerably quieter than Blackpool's central stretch, especially near Anchorsholme Park - easier to keep an eye on younger children without the crowds.",
      place: "Anchorsholme Park",
    },
    sunsetSpots: {
      headline: "North of Jubilee Gardens, towards Rossall",
      body: "The northern end of Cleveleys Promenade, past Jubilee Gardens towards Rossall, catches the same sunset as Blackpool's Promenade with a fraction of the people watching it.",
      place: "Jubilee Gardens Cleveleys",
    },
    quietAlternatives: {
      headline: "Cleveleys' Promenade over Blackpool's",
      body: "On a sunny weekend, Blackpool's central Promenade gets genuinely crowded. Cleveleys' Promenade is the same coastline and the same sea view, a short tram ride away, with far more room to actually walk.",
    },
    shortcuts: {
      headline: "The tram beats driving in on a summer weekend",
      body: "The Blackpool Tramway runs straight through Cleveleys and is more reliable than driving in on a busy summer weekend - it also drops you closer to the Tower and Pleasure Beach than most car parks manage.",
    },
    hiddenGem: {
      headline: "Rossall Point Tower at low tide",
      body: "A striking modern coastal viewpoint a short walk north of Cleveleys that most visitors to the wider coast never walk far enough to find - best at low tide, when the sands stretch out below it.",
      place: "Rossall Point Tower",
    },
  },

  fleetwood: {
    whereLocalsGo: {
      headline: "The pubs and cafés around the Market",
      body: "Fleetwood's fishing-town character means locals stick to the pubs and cafés around the Market rather than the Esplanade - that's genuinely where you'll meet people who live here, not just visit.",
    },
    parkingToAvoid: {
      headline: "Market days tighten everything near the Market itself",
      body: "Parking right by Fleetwood Market gets tight on market days. The streets around Marine Hall, a few minutes further out, are far easier, and it's a pleasant walk in along the seafront.",
      place: "Marine Hall",
    },
    bestTimes: {
      headline: "Weekday mornings, before market-day crowds build",
      body: "Fleetwood doesn't get Blackpool's weekend day-tripper crowds, so timing matters less here overall - but on market days themselves, mornings are noticeably calmer than midday onwards.",
    },
    familyBeaches: {
      headline: "The Esplanade stretch, if you don't mind a breeze",
      body: "Fleetwood's beach near the Esplanade is quiet enough that families get more space than almost anywhere else on this coast, though it's more exposed to wind than the more sheltered stretches further south.",
    },
    sunsetSpots: {
      headline: "The western Esplanade, looking towards the lighthouses",
      body: "Because you're looking across the mouth of the Wyre estuary rather than straight out to sea, Fleetwood's western Esplanade catches a genuinely different sunset from the rest of the coast - the lighthouses in silhouette make it worth the trip alone.",
      place: "Fleetwood Pharos Lighthouse",
    },
    quietAlternatives: {
      headline: "Fleetwood itself, if Blackpool's queues put you off",
      body: "If Pleasure Beach's queues aren't for you, Fleetwood offers the opposite kind of day out entirely - the Market, the Museum and the ferry, without a single queue worth mentioning.",
    },
    shortcuts: {
      headline: "The Knott End ferry saves the drive round",
      body: "If you're exploring both banks of the Wyre estuary, the Knott End ferry is a genuine shortcut rather than just a novelty - it saves a long drive back around via Poulton-le-Fylde.",
      place: "Fleetwood Ferry",
    },
    hiddenGem: {
      headline: "The working docks by the Museum",
      body: "The working end of Fleetwood's docks, right by the Museum, still has real trawlers and fishing activity that most visitors walk straight past on their way to the Market.",
      place: "Fleetwood Museum",
    },
  },

  bispham: {
    whereLocalsGo: {
      headline: "Red Bank Road is the real high street here",
      body: "Bispham residents treat Red Bank Road as their actual high street - it's where the cafés and shops used day-to-day are, rather than anything aimed at passing tourists.",
    },
    parkingToAvoid: {
      headline: "The clifftop on a sunny weekend",
      body: "Clifftop parking fills quickly on sunny weekends. The side streets just back from Red Bank Road usually have space when the clifftop doesn't.",
    },
    bestTimes: {
      headline: "Just after the morning rush for the tram into Blackpool",
      body: "Bispham has no major attractions of its own, so timing is really about the tram into Blackpool - travelling just after the morning rush beats both the commuters and the day-trippers.",
    },
    familyBeaches: {
      headline: "The beach below the cliffs suits older kids best",
      body: "Bispham's beach, reached by steps or slopes down from the clifftop, is quieter than Blackpool's central beach - though the access suits families with older, more mobile children better than buggies.",
    },
    sunsetSpots: {
      headline: "The clifftop path, uninterrupted",
      body: "The clifftop path at Bispham has one of the best unobstructed sunset views on the whole coast, with none of the crowds you'd find on Blackpool's Promenade for the same view.",
    },
    quietAlternatives: {
      headline: "Bispham's clifftop over Blackpool's Promenade",
      body: "On a sunny day, Blackpool's central Promenade gets crowded fast. Bispham's clifftop is the same coastline and the same sunsets, a few minutes up the tram line, with far fewer people.",
    },
    shortcuts: {
      headline: "Never drive into Blackpool - just take the tram",
      body: "The tram stop at Bispham means there's rarely a reason to drive into Blackpool at all - it's usually faster than finding parking once you're there.",
      place: "Bispham Tramway Stop",
    },
    hiddenGem: {
      headline: "St Andrew's Church, just back from the cliffs",
      body: "One of the older buildings on this stretch of coast, tucked just back from the clifftop path, that most passing visitors walk straight past without a second look.",
      place: "St Andrew's Church Bispham",
    },
  },
};

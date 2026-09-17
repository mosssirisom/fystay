import {
  Baby,
  Beer,
  Building2,
  Coffee,
  Compass,
  Gem,
  ParkingSquare,
  PartyPopper,
  PawPrint,
  ShoppingBag,
  TrainFront,
  UtensilsCrossed,
  Waves,
  CloudRain,
  type LucideIcon,
} from "lucide-react";

/**
 * ============================================================================
 * EDITORIAL CONTENT - TWO VERIFICATION PASSES DONE, FINAL HUMAN READ STILL OWED
 * ============================================================================
 * Originally written from general knowledge of these towns, not verified
 * against a live source at publish time. Two web-search verification
 * passes (2026) have since checked essentially every specific named
 * business, venue and recurring event this file references.
 *
 * A later pass (2026) split the combined "Lytham St Annes" entry into
 * separate Lytham and St Annes guides, added Poulton-le-Fylde (previously
 * unlisted), and renamed "Cleveleys" to Thornton-Cleveleys with added
 * Marsh Mill/Thornton content - the Bispham entry was folded into
 * Blackpool's own listings rather than kept as a seventh town. Every new
 * or moved named fact (Lytham Hall, the Royal Lytham & St Annes Golf
 * Club's actual location, Poulton's market cross/stocks/St Chad's Church/
 * Teanlowe Centre/Wyre Way, Marsh Mill) was checked against a live source
 * at the time it was added - see the same "human read still owed" caveat
 * below for everything else.
 *
 * Pass one found three real problems, since fixed: The Syndicate nightclub
 * (closed 2011, demolished 2015 - replaced with Viva Blackpool, a real,
 * currently-operating venue), The Cottage Restaurant's address (it's on
 * Newhouse Road, Marton, not Queen Street), and Fleetwood's outlet village
 * (renamed Affinity Lancashire in 2018, was still called "Freeport").
 *
 * Pass two checked the remaining named landmarks, attractions and annual
 * events (Blackpool Air Show, Blackpool Victoria Hospital, Houndshill,
 * Abingdon Street Market, the Blackpool Tramway route, Blackpool Zoo,
 * Winter Gardens, Lytham Windmill, Lytham Festival, Royal Lytham & St
 * Annes' Open Championship rotation, St Annes Carnival, Fairhaven Lake,
 * Fleetwood's twin lighthouses, Fleetwood Market, Fleetwood Tram Sunday)
 * and found two more: Abingdon Street Market has been fully reinvented as
 * a food hall (bars, coffee, street food) rather than the gift-and-produce
 * market it was, and "Cleveleys Carnival" isn't a findable current event -
 * replaced with the real, currently-running Cleveleys Car Show. Everything
 * else checked came back current and accurate.
 *
 * What's left unchecked is now deliberately low-risk by design: generic
 * street/area references ("Victoria Road West", "Red Bank Road cafés",
 * "seafront cafés") rather than single named businesses, plus a few
 * enduring, unambiguous landmarks (Blackpool Tower, Pleasure Beach, the
 * Illuminations) too well-established to be worth a search. Someone who
 * actually knows the current Fylde Coast should still read this end to
 * end before it's presented as fully verified local knowledge - two
 * search passes close the worst gaps, they don't replace that read.
 * ============================================================================
 */

export type GuideEntry = {
  name: string;
  note: string;
  /** Key into src/lib/placeCoordinates.ts, set only when this entry names one real, singular, identifiable place - never guessed for a street, an area, or "independent shops nearby". Powers the location-aware distance/walk/drive badges on the Local Guide. */
  place?: string;
};

export type GuideCategoryKey =
  | "thingsToDo"
  | "eat"
  | "coffeeAndBreakfast"
  | "family"
  | "beachesAndWalks"
  | "pubsAndNightlife"
  | "shopping"
  | "amenities"
  | "transport"
  | "parking"
  | "dogFriendly"
  | "hiddenGems"
  | "rainyDay"
  | "events";

export type TownGuide = Record<GuideCategoryKey, GuideEntry[]> & {
  /** A short, opinionated one-liner in a local-host voice - the thing that makes this read as a guide written by someone who actually knows the place, not a scraped listicle. */
  insiderTip: string;
};

export const GUIDE_CATEGORIES: { key: GuideCategoryKey; label: string; icon: LucideIcon }[] = [
  { key: "thingsToDo", label: "Things to do", icon: Compass },
  { key: "eat", label: "Best places to eat", icon: UtensilsCrossed },
  { key: "coffeeAndBreakfast", label: "Coffee & breakfast", icon: Coffee },
  { key: "family", label: "Family activities", icon: Baby },
  { key: "beachesAndWalks", label: "Beaches & walks", icon: Waves },
  { key: "pubsAndNightlife", label: "Pubs & nightlife", icon: Beer },
  { key: "shopping", label: "Shopping", icon: ShoppingBag },
  { key: "amenities", label: "Local amenities", icon: Building2 },
  { key: "transport", label: "Transport", icon: TrainFront },
  { key: "parking", label: "Parking", icon: ParkingSquare },
  { key: "dogFriendly", label: "Dog-friendly places", icon: PawPrint },
  { key: "hiddenGems", label: "Hidden gems", icon: Gem },
  { key: "rainyDay", label: "Rainy-day activities", icon: CloudRain },
  { key: "events", label: "Events & seasonal attractions", icon: PartyPopper },
];

export const LOCAL_GUIDES: Record<string, TownGuide> = {
  blackpool: {
    insiderTip:
      "Visit outside July and August if you can - the Tower, the beach and the trams are all still there, just without the queues.",
    thingsToDo: [
      {
        name: "Blackpool Tower & Tower Eye",
        note: "Take the glass lift up for coastline views, then step onto the SkyWalk's glass floor near the top.",
        place: "Blackpool Tower",
      },
      {
        name: "Pleasure Beach Blackpool",
        note: "One of Britain's biggest amusement parks, with the Big One and a run of genuinely world-class coasters.",
        place: "Blackpool Pleasure Beach",
      },
      {
        name: "Blackpool Illuminations",
        note: "Miles of lights strung along the Promenade every autumn - the town's best-known event, running into the new year.",
      },
      {
        name: "Winter Gardens & Opera House",
        note: "A Victorian entertainment complex still hosting touring shows and conferences inside genuinely ornate interiors.",
        place: "Winter Gardens Blackpool",
      },
    ],
    eat: [
      {
        name: "The Cottage Restaurant, Newhouse Road, Marton",
        note: "A long-standing sit-down fish and chip restaurant, a step up from a seafront takeaway - a short drive or taxi inland from the seafront, not a walk-in on the Golden Mile.",
      },
      {
        name: "Bonny Street",
        note: "The town's traditional fish market street, with a cluster of chip shops that have fed generations of holidaymakers.",
      },
      {
        name: "Big Blue Hotel restaurant, by Pleasure Beach",
        note: "Family-friendly dining right by the rides - useful if you're spending the whole day there.",
      },
    ],
    coffeeAndBreakfast: [
      {
        name: "Seafront cafés along the North Shore",
        note: "Classic full-English breakfasts with a sea view, quieter than the cafés directly under the Tower.",
      },
      {
        name: "Church Street and Bispham Road cafés",
        note: "A more local, less touristy breakfast scene just back from the Golden Mile.",
      },
      {
        name: "Winter Gardens café",
        note: "A good coffee stop if you're already exploring the Spanish Hall or catching a show.",
      },
    ],
    family: [
      {
        name: "Sandcastle Waterpark",
        note: "Indoor slides and wave pools next to Pleasure Beach - a solid rainy-day option too.",
        place: "Sandcastle Waterpark",
      },
      {
        name: "Blackpool Zoo",
        note: "Set back in Stanley Park, with elephants, orangutans and a safari-style layout.",
        place: "Blackpool Zoo",
      },
      {
        name: "SEA LIFE Blackpool",
        note: "An aquarium beneath the Promenade with a walk-through ocean tunnel.",
        place: "SEA LIFE Blackpool",
      },
    ],
    beachesAndWalks: [
      {
        name: "Blackpool's main beach",
        note: "Miles of flat sand running the length of the Promenade, best a couple of hours either side of low tide.",
      },
      {
        name: "The Promenade",
        note: "A flat, tram-lined walking and cycling route running the whole length of the resort.",
      },
      {
        name: "Stanley Park",
        note: "An inland green space with a boating lake and Italian Gardens - a break from the seafront crowds.",
        place: "Stanley Park Blackpool",
      },
    ],
    pubsAndNightlife: [
      {
        name: "Viva Blackpool, next to the Tower",
        note: "A cabaret, restaurant and events venue right on the Promenade, with a nightly variety show and a late bar.",
      },
      {
        name: "Seafront and town-centre Wetherspoon pubs",
        note: "Reliable, good-value options if you just want a straightforward pint.",
      },
      {
        name: "Winter Gardens' Spanish Hall and Empress Ballroom",
        note: "Occasional live music and events in genuinely grand surroundings.",
      },
    ],
    shopping: [
      {
        name: "Houndshill Shopping Centre",
        note: "The town's main indoor shopping centre, just back from the seafront.",
        place: "Houndshill Shopping Centre",
      },
      {
        name: "Coral Island",
        note: "An amusement arcade and gift-shop landmark on the Golden Mile, a Blackpool fixture for decades.",
      },
      {
        name: "Abingdon Street Market",
        note: "Blackpool's own food hall and indoor market after a full renovation - independent bars, coffee and street food stalls alongside retail units, right in the town centre.",
      },
    ],
    amenities: [
      {
        name: "Blackpool Victoria Hospital",
        note: "The area's main hospital, on Whinney Heys Road.",
      },
      {
        name: "Large supermarkets",
        note: "Tesco, Sainsbury's and Asda all run large stores in and around the town.",
      },
      {
        name: "Pharmacies and NHS walk-in services",
        note: "Available at several points along the seafront and town centre.",
      },
    ],
    transport: [
      {
        name: "Blackpool Tramway",
        note: "Heritage and modern trams run the full coast from Starr Gate to Fleetwood Ferry, right past the Promenade.",
      },
      {
        name: "Blackpool North railway station",
        note: "The main line station, a short walk or tram ride from the seafront.",
      },
      {
        name: "Arriving from further afield",
        note: "Most visitors fly into Manchester or Liverpool and travel on by road or rail - Blackpool Airport has no scheduled passenger flights.",
      },
    ],
    parking: [
      {
        name: "Promenade pay-and-display car parks",
        note: "Several along the seafront, busiest in summer and during the Illuminations.",
      },
      {
        name: "Multi-storey car parks near Houndshill",
        note: "A good bet if seafront parking is full, especially on peak weekends.",
        place: "Houndshill Shopping Centre",
      },
      {
        name: "Arrive early on peak days",
        note: "There's no park-and-ride scheme currently - getting there early makes the real difference in summer.",
      },
    ],
    dogFriendly: [
      {
        name: "Blackpool's beach",
        note: "Dogs are welcome on most stretches, though seasonal restrictions apply on the central beach in summer - check current signage.",
      },
      {
        name: "Stanley Park",
        note: "A popular inland walk for dog owners away from the seafront crowds.",
        place: "Stanley Park Blackpool",
      },
      {
        name: "Seafront pubs and cafés",
        note: "Several welcome dogs - always worth asking, especially outside peak hours.",
      },
    ],
    hiddenGems: [
      {
        name: "The Comedy Carpet",
        note: "A huge art installation of comedians' catchphrases set into the pavement by the Tower - easy to walk straight over without noticing.",
        place: "Comedy Carpet",
      },
      {
        name: "Early morning on the Promenade",
        note: "The tram line and beach are almost empty before the day-trippers arrive.",
      },
      {
        name: "The Winter Gardens' original Victorian interiors",
        note: "Most visitors never get past the ticket hall for a show.",
      },
    ],
    rainyDay: [
      { name: "Sandcastle Waterpark", note: "Indoor and warm, whatever the weather outside.", place: "Sandcastle Waterpark" },
      { name: "Madame Tussauds Blackpool", note: "A fully indoor seafront attraction on the Golden Mile." },
      { name: "SEA LIFE Blackpool", note: "Another reliable indoor option right on the Promenade.", place: "SEA LIFE Blackpool" },
    ],
    events: [
      {
        name: "Blackpool Illuminations",
        note: "Switched on every autumn and running for several weeks into the new year.",
      },
      {
        name: "Blackpool Air Show",
        note: "A seafront air display held most summers, one of the UK's biggest free air shows.",
      },
      {
        name: "Winter Gardens events calendar",
        note: "Touring shows, conferences and seasonal events year-round.",
      },
    ],
  },

  lytham: {
    insiderTip:
      "Lytham Green on a summer evening, with the tide in and the windmill lit up, is this coast's best-kept secret - most visitors never get past Blackpool to see it.",
    thingsToDo: [
      {
        name: "Lytham Windmill",
        note: "A working windmill on Lytham Green, one of the coast's most-photographed landmarks.",
        place: "Lytham Windmill",
      },
      {
        name: "Lowther Pavilion",
        note: "Lytham's own theatre, with a year-round programme of shows and touring productions.",
        place: "Lowther Pavilion",
      },
      {
        name: "Lytham Hall",
        note: "A Georgian country house a mile inland, set in 78 acres of parkland open most days - most visitors never leave the green to find it.",
        place: "Lytham Hall",
      },
    ],
    eat: [
      {
        name: "Clifton Street, Lytham",
        note: "The town's main strip for independent dining, from bistros to seafood.",
      },
      {
        name: "The Taps, Henry Street, Lytham",
        note: "A well-known real ale pub that also serves food.",
      },
      {
        name: "West Beach, near Lowther Gardens",
        note: "A quieter cluster of cafés and restaurants by the theatre, a short walk from the green.",
      },
    ],
    coffeeAndBreakfast: [
      {
        name: "Clifton Street and Park Street, Lytham",
        note: "The town's boutique-shopping-and-coffee strip - a proper morning out, not just a stop.",
      },
      {
        name: "Booths, Lytham",
        note: "The Northern regional chain's own food hall and café - popular as a stop in its own right.",
      },
      {
        name: "Lowther Gardens café",
        note: "A good stop if you're already walking the gardens or catching a show.",
        place: "Lowther Pavilion",
      },
    ],
    family: [
      {
        name: "Lowther Pavilion",
        note: "Family-friendly matinees and a pantomime season alongside its main programme.",
        place: "Lowther Pavilion",
      },
      {
        name: "Lytham Green",
        note: "Wide, flat and open - safe space for younger children away from traffic, right by the windmill.",
      },
      {
        name: "Lytham Hall's parkland",
        note: "Free-roam grounds and woodland trails for a picnic or a run-around, a mile from the green.",
        place: "Lytham Hall",
      },
    ],
    beachesAndWalks: [
      {
        name: "Lytham Green",
        note: "A large open green running along the estuary, popular for a flat evening stroll.",
      },
      {
        name: "The coastal path towards St Annes",
        note: "Links the green to Fairhaven Lake and St Annes beach in one easy walk.",
      },
      {
        name: "Lytham Hall's woodland trails",
        note: "A quieter, inland alternative to the seafront walk.",
        place: "Lytham Hall",
      },
    ],
    pubsAndNightlife: [
      { name: "The Taps, Lytham", note: "A long-standing real ale pub, popular with locals." },
      { name: "Clifton Arms Hotel, Lytham", note: "A traditional hotel bar right on the green." },
      { name: "Clifton Street's small bars", note: "A calmer, more grown-up scene than Blackpool's." },
    ],
    shopping: [
      {
        name: "Clifton Street and Park Street, Lytham",
        note: "Independent boutiques, gift shops and delis.",
      },
      {
        name: "Booths, Lytham",
        note: "Popular for something a bit more upmarket than a standard supermarket shop.",
      },
      { name: "Independent gift shops around the green", note: "A short browse before or after a walk." },
    ],
    amenities: [
      { name: "Local GP surgeries and a health centre", note: "Serve Lytham directly." },
      { name: "Pharmacies along Clifton Street", note: "Cover the town centre." },
      { name: "Supermarkets and high-street banks", note: "In and around the town centre." },
    ],
    transport: [
      {
        name: "Lytham and Ansdell & Fairhaven railway stations",
        note: "Connect to Preston and onward to the wider rail network.",
        place: "Ansdell & Fairhaven",
      },
      {
        name: "Coast-road bus routes",
        note: "Regular services link Lytham to St Annes and Blackpool.",
      },
      {
        name: "The walk into St Annes",
        note: "Flat and mostly traffic-free along the green and coastal path - often quicker than driving and parking twice.",
      },
    ],
    parking: [
      {
        name: "Pay-and-display parking along Lytham Green",
        note: "The main option in the town centre.",
      },
      {
        name: "Streets just south of Clifton Street",
        note: "Usually has space when the green's own car park is full - and it's a shorter walk to the shops from there.",
      },
      { name: "Lytham Hall car park", note: "Useful for a slower visit to the parkland.", place: "Lytham Hall" },
    ],
    dogFriendly: [
      {
        name: "Lytham Green",
        note: "Wide open space that's easy walking for dogs - check local signage for any lead-only areas.",
      },
      {
        name: "Lytham Hall's parkland",
        note: "Extensive woodland and open grounds for a longer walk.",
        place: "Lytham Hall",
      },
      {
        name: "Cafés around Clifton Street",
        note: "Several welcome dogs at outside tables.",
      },
    ],
    hiddenGems: [
      {
        name: "Lytham Windmill's small museum",
        note: "Most visitors photograph the outside and miss it entirely.",
      },
      {
        name: "Lytham Hall's 78 acres of parkland",
        note: "A mile inland from the green, and most day-trippers never walk far enough to find it.",
        place: "Lytham Hall",
      },
      {
        name: "The far end of Lytham Green",
        note: "Saltmarsh views over the Ribble estuary, away from the main green.",
      },
    ],
    rainyDay: [
      { name: "Lowther Pavilion", note: "A full indoor programme of shows whatever the weather.", place: "Lowther Pavilion" },
      { name: "Clifton Street cafés", note: "A slower-paced, indoor way to spend a wet afternoon." },
      { name: "Booths café, Lytham", note: "Genuinely popular as a coffee stop in its own right." },
    ],
    events: [
      {
        name: "Lytham Festival",
        note: "A summer music festival held on Lytham Green, drawing major touring artists.",
      },
      {
        name: "The Open Championship",
        note: "Royal Lytham & St Annes hosts it on rotation, just along the coast in St Annes - a huge date for the whole town when it does.",
      },
      {
        name: "Lytham Hall's seasonal open days",
        note: "Additional house openings and events through spring, summer and Christmas.",
        place: "Lytham Hall",
      },
    ],
  },

  "st-annes": {
    insiderTip:
      "St Annes' pier and promenade get all the day-trippers heading for the beach - Ashton Gardens and Fairhaven Lake, both two minutes off the seafront, stay quiet even in August.",
    thingsToDo: [
      {
        name: "St Annes Pier",
        note: "A Victorian pier with amusements right on the promenade, quieter than Blackpool's piers.",
        place: "St Annes Pier",
      },
      {
        name: "Ashton Gardens",
        note: "A formal Victorian park with a lake and aviary, a short walk back from the seafront.",
        place: "Ashton Gardens",
      },
      {
        name: "Royal Lytham & St Annes Golf Club",
        note: "A genuine Open Championship course a mile from the town centre - even non-golfers will recognise the name.",
        place: "Royal Lytham & St Annes Golf Club",
      },
    ],
    eat: [
      {
        name: "Seafront fish restaurants, St Annes",
        note: "A reliable catch-of-the-day option close to the beach.",
      },
      {
        name: "Wood Street, St Annes",
        note: "A quieter, more local dining scene than the seafront.",
      },
      {
        name: "Promenade cafés near the pier",
        note: "Straightforward food with a sea view.",
      },
    ],
    coffeeAndBreakfast: [
      {
        name: "Wood Street, St Annes",
        note: "A quieter, more local breakfast scene than the seafront.",
      },
      {
        name: "Ashton Gardens café",
        note: "A good stop if you're already walking the gardens.",
        place: "Ashton Gardens",
      },
      {
        name: "Promenade cafés near the pier",
        note: "Classic seafront breakfasts, calmer than Blackpool's equivalents.",
      },
    ],
    family: [
      {
        name: "Fairhaven Lake",
        note: "Pedal boats and a model boating lake, with a park alongside for a full day out.",
        place: "Fairhaven Lake",
      },
      {
        name: "St Annes beach",
        note: "Wide, flat sand backed by dunes, generally quieter than Blackpool's.",
      },
      {
        name: "St Annes Pier's amusements",
        note: "A smaller, calmer alternative to Blackpool's arcades.",
        place: "St Annes Pier",
      },
    ],
    beachesAndWalks: [
      {
        name: "St Annes beach and sand dunes",
        note: "A long, quieter stretch of coast with a nature reserve behind the dunes.",
      },
      {
        name: "Fairhaven Lake's lakeside path",
        note: "An easy, flat loop popular with families and dog walkers.",
        place: "Fairhaven Lake",
      },
      {
        name: "The coastal path towards Lytham Green",
        note: "Links the beach, the lake and the green in one easy walk.",
      },
    ],
    pubsAndNightlife: [
      {
        name: "St Annes' seafront bars",
        note: "A calmer, more grown-up nightlife scene than Blackpool's.",
      },
      { name: "Wood Street pubs", note: "A more local scene, back from the promenade." },
      { name: "Promenade bars near the pier", note: "Straightforward seafront drinking with a sea view." },
    ],
    shopping: [
      { name: "Wood Street, St Annes", note: "A strip of independent shops, generally quiet." },
      { name: "Seafront gift shops near the pier", note: "For the usual seaside essentials." },
      {
        name: "Ashton Gardens' gift kiosk",
        note: "A small stop if you're already in the gardens.",
        place: "Ashton Gardens",
      },
    ],
    amenities: [
      { name: "Local GP surgeries and health centres", note: "Serve St Annes directly." },
      { name: "Pharmacies along Wood Street", note: "Cover the town centre." },
      { name: "Supermarkets and high-street banks", note: "In and around the town centre." },
    ],
    transport: [
      {
        name: "St Annes-on-the-Sea railway station",
        note: "Sits right by the town centre, with connections to Preston and beyond.",
      },
      {
        name: "Ansdell & Fairhaven railway station",
        note: "The closer stop for Fairhaven Lake and the western end of town.",
        place: "Ansdell & Fairhaven",
      },
      {
        name: "Coast-road bus routes",
        note: "Regular services link St Annes to Lytham and Blackpool.",
      },
    ],
    parking: [
      {
        name: "Pay-and-display parking along the St Annes seafront",
        note: "The main option near the beach and pier.",
      },
      { name: "Fairhaven Lake car park", note: "Useful for a family day out at the lake.", place: "Fairhaven Lake" },
      {
        name: "Streets back from the promenade",
        note: "Usually easier to find space than right on the seafront.",
      },
    ],
    dogFriendly: [
      {
        name: "St Annes beach and dunes",
        note: "A popular, spacious dog walk with year-round access on most stretches.",
      },
      {
        name: "Fairhaven Lake's paths",
        note: "Flat, easy walking around the lake.",
        place: "Fairhaven Lake",
      },
      {
        name: "Ashton Gardens' outer paths",
        note: "Some areas are lead-only - check signage on arrival.",
        place: "Ashton Gardens",
      },
    ],
    hiddenGems: [
      {
        name: "Ashton Gardens' lake and aviary",
        note: "A proper formal park two minutes off the seafront that most day-trippers heading for the beach never find.",
        place: "Ashton Gardens",
      },
      {
        name: "The dunes at the western end of St Annes beach",
        note: "A genuine nature reserve most visitors walk straight past.",
      },
    ],
    rainyDay: [
      { name: "St Annes Pier's amusements", note: "A sheltered, indoor-ish option right on the seafront.", place: "St Annes Pier" },
      { name: "Wood Street cafés", note: "A slower-paced, indoor way to spend a wet afternoon." },
      { name: "Ashton Gardens' aviary", note: "Covered viewing even when the weather turns.", place: "Ashton Gardens" },
    ],
    events: [
      {
        name: "St Annes Carnival",
        note: "A long-running town carnival weekend at Ashton Gardens each July, with a parade, live music and stalls.",
      },
      {
        name: "The Open Championship",
        note: "Royal Lytham & St Annes hosts it on rotation - a huge date for the town when it does.",
      },
    ],
  },

  "poulton-le-fylde": {
    insiderTip:
      "Poulton has no seafront and isn't trying to be Blackpool - come for the market square and a proper local pub, then be on the coast in fifteen minutes when you want it.",
    thingsToDo: [
      {
        name: "Poulton's Market Cross and stocks",
        note: "An 18th-century market cross, stocks and whipping post still standing in Market Square, right outside the churchyard.",
        place: "Poulton-le-Fylde",
      },
      {
        name: "St Chad's Church",
        note: "A church on this site dates to the 11th century; the current tower is 17th-century - one of the oldest working churches on the Fylde.",
        place: "St Chad's Church Poulton",
      },
      {
        name: "The Wyre Way to Skippool Creek",
        note: "A waymarked footpath east from town, past the old Port of Poulton's boat-lined creek, to Wyre Estuary Country Park at Stanah.",
        place: "Wyre Estuary Country Park",
      },
    ],
    eat: [
      { name: "The Golden Ball, Ball Street", note: "A long-standing town-centre pub." },
      { name: "Market Place and Tithebarn Street", note: "The town's main cluster of cafés and restaurants." },
      { name: "Independent bakeries around the town centre", note: "A good stop before a walk out to Skippool." },
    ],
    coffeeAndBreakfast: [
      { name: "Market Place and Queensway", note: "The town's everyday breakfast and coffee spots." },
      { name: "Teanlowe Centre café", note: "Handy if you're already shopping there.", place: "Teanlowe Centre" },
      { name: "Cafés around the church and market square", note: "A quieter, more local start to the day." },
    ],
    family: [
      {
        name: "Wyre Estuary Country Park, Stanah",
        note: "A visitor centre, café and toilets at the halfway point of the Wyre Way walk from town.",
        place: "Wyre Estuary Country Park",
      },
      { name: "Teanlowe Centre", note: "An easy, sheltered stop for younger children.", place: "Teanlowe Centre" },
      { name: "Poulton Market", note: "A proper Monday market for children to explore stalls and produce." },
    ],
    beachesAndWalks: [
      {
        name: "The Wyre Way to Wyre Estuary Country Park",
        note: "An easy, flat walk east from town via Skippool Creek - no beach here, but a genuine country walk instead.",
        place: "Wyre Estuary Country Park",
      },
      {
        name: "Skippool Creek",
        note: "A narrow, boat-lined creek at the old Port of Poulton - a quiet spot most visitors to the coast never see.",
      },
      { name: "Fields and footpaths east of town", note: "Flat, quiet walking away from the road." },
    ],
    pubsAndNightlife: [
      { name: "The Golden Ball, Ball Street", note: "A genuine town-centre local." },
      { name: "Hardhorn Road's traditional pubs", note: "Including one distinctive thatched-roof building." },
      { name: "Market Place bars", note: "A quiet, local scene rather than a night out." },
    ],
    shopping: [
      {
        name: "Teanlowe Centre",
        note: "A shopping centre mixing national names with independent local retailers.",
        place: "Teanlowe Centre",
      },
      {
        name: "Poulton Market, Market Square",
        note: "A proper street market every Monday, all year round - deli, fish, fruit and veg, clothing and gifts.",
        place: "Poulton-le-Fylde",
      },
      { name: "Independent shops along Market Place and Church Street", note: "A genuine local high street." },
    ],
    amenities: [
      { name: "GP surgeries and a health centre", note: "Serve the town centre directly." },
      { name: "Banks and a post office", note: "Along Market Place and Queensway." },
      { name: "Supermarkets", note: "Within easy reach of the town centre." },
    ],
    transport: [
      {
        name: "Poulton-le-Fylde railway station",
        note: "The coast's main rail interchange - direct trains to Preston, Manchester and beyond, not just a local stop.",
        place: "Poulton-le-Fylde",
      },
      {
        name: "Bus routes to Fleetwood, Blackpool and Cleveleys",
        note: "Poulton sits at the hub of the coast's bus network, not just its rail line.",
      },
      {
        name: "Closer to the coast than it looks",
        note: "A short drive or bus ride reaches Blackpool, Fleetwood or Cleveleys' seafronts.",
      },
    ],
    parking: [
      { name: "Teanlowe Centre car park", note: "The main option for the town centre.", place: "Teanlowe Centre" },
      {
        name: "Market Place on-street parking",
        note: "Tightest on Monday mornings during the market - arrive earlier if you can.",
      },
      { name: "Station car park", note: "Useful if you're arriving by train from further afield." },
    ],
    dogFriendly: [
      {
        name: "The Wyre Way and Skippool Creek",
        note: "A genuine longer walk for well-exercised dogs, away from any seafront crowds.",
        place: "Wyre Estuary Country Park",
      },
      { name: "Market Square and the town centre", note: "Easy, flat walking on the way to a coffee stop." },
      { name: "Fields east of town", note: "Quiet, open walking away from traffic." },
    ],
    hiddenGems: [
      {
        name: "The stocks and whipping post by the church",
        note: "Right in Market Square, and most passing visitors walk straight past without noticing.",
        place: "Poulton-le-Fylde",
      },
      {
        name: "Skippool Creek's old boats",
        note: "A quietly atmospheric spot at the old Port of Poulton, a mile from the market square.",
      },
    ],
    rainyDay: [
      { name: "Teanlowe Centre", note: "A sheltered, indoor shopping stop.", place: "Teanlowe Centre" },
      { name: "St Chad's Church", note: "Worth a look inside when it's open.", place: "St Chad's Church Poulton" },
      { name: "Market Place cafés", note: "An easy, dry way to spend an hour." },
    ],
    events: [
      { name: "Poulton Market", note: "Every Monday, all year round, in Market Square and outside Teanlowe Centre.", place: "Teanlowe Centre" },
      { name: "Seasonal events at Teanlowe Centre", note: "Including Christmas and market-square gatherings.", place: "Teanlowe Centre" },
    ],
  },

  "thornton-cleveleys": {
    insiderTip:
      "Cleveleys is what Blackpool's seafront would look like if you took away the crowds and kept the sea view - and Thornton, a short walk inland, adds a genuine 18th-century windmill village most coast visitors never see.",
    thingsToDo: [
      {
        name: "Cleveleys Promenade",
        note: "A striking, redesigned seafront with modern shelters and open lawns, distinct from Blackpool's.",
      },
      {
        name: "Marsh Mill Village, Thornton",
        note: "An 18th-century windmill - the only one still working in the whole of North West England - surrounded by a courtyard of independent and craft shops.",
        place: "Marsh Mill",
      },
      {
        name: "Anchorsholme Park",
        note: "A splash park, skate park and open green space right by the coast.",
        place: "Anchorsholme Park",
      },
      {
        name: "Jubilee Gardens",
        note: "Landscaped seafront gardens - a quieter spot for a sit-down and a view.",
        place: "Jubilee Gardens Cleveleys",
      },
    ],
    eat: [
      {
        name: "Victoria Road West",
        note: "The town's main strip for eating out, from cafés to sit-down restaurants.",
      },
      {
        name: "Promenade fish and chip shops",
        note: "A Cleveleys tradition, generally quieter than Blackpool's equivalents.",
      },
      {
        name: "Rossall's independent restaurants",
        note: "A short walk or drive north, with a slightly more upmarket dining scene.",
      },
    ],
    coffeeAndBreakfast: [
      {
        name: "Victoria Road West and the Promenade",
        note: "A relaxed, less crowded breakfast scene than Blackpool.",
      },
      {
        name: "Anchorsholme Park café",
        note: "Handy if you're already at the splash park or skate park.",
        place: "Anchorsholme Park",
      },
      {
        name: "Town-centre coffee shops",
        note: "Just back from the seafront, popular with locals rather than day-trippers.",
      },
    ],
    family: [
      {
        name: "Anchorsholme Park splash park",
        note: "A free, popular water play area for younger children in summer.",
        place: "Anchorsholme Park",
      },
      {
        name: "Cleveleys beach",
        note: "Flat and sandy, generally quieter and easier for young families than Blackpool's central beach.",
      },
      {
        name: "The tram to Blackpool or Fleetwood",
        note: "A genuine day out in itself for younger children.",
      },
    ],
    beachesAndWalks: [
      {
        name: "Cleveleys beach",
        note: "Several miles of flat sand, with the option to walk south towards Bispham or north to Rossall.",
      },
      {
        name: "The Promenade",
        note: "A flat, well-maintained walking and cycling route the length of the town.",
      },
      {
        name: "Rossall Point and the coastal path north",
        note: "A slightly longer walk with sea views over the Wyre estuary.",
        place: "Rossall Point Tower",
      },
    ],
    pubsAndNightlife: [
      { name: "Victoria Road West pubs", note: "Traditional pubs along the town's main street." },
      {
        name: "Promenade seafront bars",
        note: "Quieter and more local than Blackpool's nightlife.",
      },
      {
        name: "For a bigger night out",
        note: "Most visitors head into Blackpool or Fleetwood - Cleveleys itself is generally an early-night town.",
      },
    ],
    shopping: [
      {
        name: "Victoria Road West",
        note: "The town's main shopping street, with independent shops and cafés.",
      },
      {
        name: "Marsh Mill Village's craft shops, Thornton",
        note: "A courtyard of independent shops built around the windmill - a genuinely different shopping trip from the seafront.",
        place: "Marsh Mill",
      },
      { name: "Cleveleys Market", note: "A small local market held periodically in the town centre." },
    ],
    amenities: [
      { name: "A local health centre and pharmacy", note: "Serve the town centre directly." },
      { name: "Banks and a post office", note: "Based along Victoria Road West." },
      {
        name: "Larger amenities",
        note: "Hospitals and big supermarkets are a short tram or drive away in Blackpool or Fleetwood.",
      },
    ],
    transport: [
      {
        name: "The Blackpool Tramway",
        note: "Runs straight through Cleveleys, linking it to Blackpool and Fleetwood.",
      },
      { name: "Bus routes", note: "Connect Cleveleys to the wider Fylde Coast." },
      {
        name: "Poulton-le-Fylde railway station",
        note: "A short drive inland - the nearest mainline rail connection.",
      },
    ],
    parking: [
      {
        name: "Promenade and Victoria Road West parking",
        note: "Pay-and-display parking near the seafront and main shopping street.",
      },
      {
        name: "Generally easier than central Blackpool",
        note: "Even in peak summer.",
      },
      { name: "Anchorsholme Park car park", note: "For families visiting the splash park.", place: "Anchorsholme Park" },
    ],
    dogFriendly: [
      {
        name: "Cleveleys beach",
        note: "Dog-friendly on most stretches outside peak summer restrictions.",
      },
      {
        name: "Anchorsholme Park",
        note: "Plenty of open grass for dog walking alongside the splash park.",
        place: "Anchorsholme Park",
      },
      { name: "Promenade cafés", note: "Several allow dogs at outside tables." },
    ],
    hiddenGems: [
      {
        name: "Rossall Point Tower",
        note: "A striking modern coastal observation tower most visitors never walk far enough north to find.",
        place: "Rossall Point Tower",
      },
      {
        name: "Thornton Little Theatre",
        note: "A community theatre inland in Thornton that most Cleveleys visitors never realise is there.",
      },
      {
        name: "Sunset on the northern Promenade",
        note: "A clear view back towards Blackpool Tower.",
      },
    ],
    rainyDay: [
      { name: "Marsh Mill Village's shops, Thornton", note: "A sheltered, indoor-ish craft-shopping trip whatever the weather.", place: "Marsh Mill" },
      { name: "Victoria Road West cafés and shops", note: "An easy indoor afternoon." },
      { name: "A short tram ride into Blackpool", note: "For its indoor attractions." },
    ],
    events: [
      { name: "Cleveleys Car Show", note: "An annual show bringing hundreds of vehicles to Victoria Road West and the seafront each June, with live entertainment and stalls." },
      { name: "Thornton Little Theatre's programme", note: "A year-round schedule of community and touring shows inland in Thornton." },
      {
        name: "Illuminations",
        note: "Extend along parts of the Cleveleys seafront in autumn, an extension of Blackpool's main display.",
      },
    ],
  },

  fleetwood: {
    insiderTip:
      "Fleetwood is the quiet end of the coast - go for the Market, the lighthouses and the ferry, and you'll get a genuinely different day out from the rest of the Fylde Coast in the same afternoon.",
    thingsToDo: [
      {
        name: "Fleetwood Museum",
        note: "A maritime museum covering the town's fishing and trawler history, right on the waterfront.",
        place: "Fleetwood Museum",
      },
      {
        name: "Fleetwood's twin lighthouses",
        note: "The Lower and Upper Lighthouses, both distinctive 1840s landmarks designed by Decimus Burton.",
        place: "Fleetwood Pharos Lighthouse",
      },
      {
        name: "The Fleetwood-Knott End ferry",
        note: "A short foot-passenger ferry crossing the mouth of the River Wyre.",
        place: "Fleetwood Ferry",
      },
    ],
    eat: [
      {
        name: "Fleetwood Market",
        note: "As much a place to eat as to shop, with food stalls alongside the market traders.",
        place: "Fleetwood Market",
      },
      {
        name: "Seafront fish and chip restaurants",
        note: "A genuine claim to authenticity in a town built on the fishing trade.",
      },
      {
        name: "Town-centre cafés and restaurants",
        note: "Clustered around the Market.",
      },
    ],
    coffeeAndBreakfast: [
      { name: "Cafés in and around Fleetwood Market", note: "The town's main breakfast spot.", place: "Fleetwood Market" },
      { name: "Marine Hall café", note: "Overlooks the seafront gardens.", place: "Marine Hall" },
      {
        name: "Independent coffee shops",
        note: "Along the town's main shopping streets.",
      },
    ],
    family: [
      {
        name: "Marine Hall and Gardens",
        note: "Seafront gardens with occasional family events and a paddling pool in summer.",
        place: "Marine Hall",
      },
      {
        name: "Fleetwood Museum",
        note: "Hands-on maritime exhibits that tend to hold children's attention well.",
        place: "Fleetwood Museum",
      },
      {
        name: "The full length of the Blackpool Tramway",
        note: "Starts here - a proper day out for younger children in its own right.",
      },
    ],
    beachesAndWalks: [
      {
        name: "Fleetwood beach and the Esplanade",
        note: "A quieter stretch of coast at the northern tip of the Fylde peninsula.",
      },
      {
        name: "The Wyre estuary path",
        note: "Walk from the ferry crossing along the river rather than the open coast.",
      },
      {
        name: "Rossall Point, just south of Fleetwood",
        note: "Coastal path views back down the coast towards Cleveleys and Blackpool.",
      },
    ],
    pubsAndNightlife: [
      {
        name: "Pubs around the Market and town centre",
        note: "Several with genuine fishing-town history.",
      },
      {
        name: "Seafront pubs near the Esplanade",
        note: "Generally quiet and local rather than a nightlife destination.",
      },
      {
        name: "For a bigger night out",
        note: "Most visitors head down the tramway into Blackpool.",
      },
    ],
    shopping: [
      {
        name: "Fleetwood Market",
        note: "One of the region's better-known indoor and outdoor markets - a genuine destination in its own right.",
        place: "Fleetwood Market",
      },
      {
        name: "Affinity Lancashire, by the docks",
        note: "An outlet shopping centre on the site of the old Freeport development - over 45 stores plus places to eat.",
      },
      { name: "Independent shops around the town centre", note: "A mix of everyday and gift shopping." },
    ],
    amenities: [
      {
        name: "GP surgeries and a health centre",
        note: "Supplement Victoria Hospital's services locally.",
      },
      { name: "Supermarkets, banks and a post office", note: "In the town centre." },
      { name: "A small library and community facilities", note: "Based near the town centre." },
    ],
    transport: [
      {
        name: "Fleetwood Ferry tram stop",
        note: "The northern terminus of the Blackpool Tramway - the whole line starts (or ends) here.",
      },
      {
        name: "The Knott End ferry",
        note: "Crosses the River Wyre on foot, useful for exploring both banks of the estuary.",
      },
      {
        name: "Bus routes to Poulton-le-Fylde",
        note: "Connect on to the wider rail network.",
      },
    ],
    parking: [
      {
        name: "Marine Hall and Esplanade parking",
        note: "Pay-and-display parking near the seafront.",
      },
      {
        name: "On-street parking",
        note: "Generally easier to find here than further south on the coast.",
      },
      {
        name: "Parking near Fleetwood Market",
        note: "Fills up on market days - arrive earlier if you can.",
      },
    ],
    dogFriendly: [
      {
        name: "Fleetwood's quieter beaches and the Esplanade",
        note: "Generally easy dog walking with fewer crowds than Blackpool.",
      },
      { name: "The Wyre estuary path", note: "A good longer walk for well-exercised dogs." },
      {
        name: "Town-centre pubs",
        note: "Several welcome dogs, particularly away from mealtime rushes.",
      },
    ],
    hiddenGems: [
      {
        name: "The Fleetwood Lighthouses at dusk",
        note: "The Lower Lighthouse still functions as a working navigation aid.",
        place: "Fleetwood Pharos Lighthouse",
      },
      {
        name: "The Knott End ferry crossing",
        note: "A five-minute trip most coast visitors never think to take.",
        place: "Fleetwood Ferry",
      },
      {
        name: "Fleetwood Museum's smaller exhibits",
        note: "The town's trawling-disaster displays are easy to miss but genuinely moving.",
        place: "Fleetwood Museum",
      },
    ],
    rainyDay: [
      { name: "Fleetwood Museum", note: "Fully indoors and covers a good hour or two.", place: "Fleetwood Museum" },
      { name: "Fleetwood Market's indoor hall", note: "A dry way to spend a wet morning." },
      {
        name: "Affinity Lancashire, by the docks",
        note: "Largely under cover.",
      },
    ],
    events: [
      {
        name: "Fleetwood Tram Sunday",
        note: "An annual event bringing historic trams from along the coast into the town.",
      },
      { name: "Fleetwood Market's seasonal events", note: "Including a Christmas market." },
      {
        name: "Illuminations",
        note: "Extend along parts of the Fleetwood seafront, continuing the main Blackpool display north.",
      },
    ],
  },
};

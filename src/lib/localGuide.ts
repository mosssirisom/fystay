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
 * EDITORIAL CONTENT - HUMAN REVIEW NEEDED BEFORE THIS SHIPS TO PRODUCTION
 * ============================================================================
 * Everything below was written from general knowledge of these five towns,
 * not verified against a live source at publish time. The "things to do",
 * "beaches & walks", "transport" and "parking" categories describe stable,
 * long-standing landmarks and infrastructure and are low-risk. The
 * business-specific categories - "eat", "coffeeAndBreakfast",
 * "pubsAndNightlife", "shopping" and some "hiddenGems"/"dogFriendly" entries
 * - name real, well-known establishments and streets, but opening status,
 * ownership and quality can all change. Before this guide goes live, a
 * human who actually knows the current Fylde Coast should read every named
 * business entry (not the generic "along this street" ones) and confirm
 * it's still open and still worth recommending. Treat this file as a first
 * draft of real content, not a verified source of truth.
 * ============================================================================
 */

export type GuideEntry = {
  name: string;
  note: string;
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
      },
      {
        name: "Pleasure Beach Blackpool",
        note: "One of Britain's biggest amusement parks, with the Big One and a run of genuinely world-class coasters.",
      },
      {
        name: "Blackpool Illuminations",
        note: "Miles of lights strung along the Promenade every autumn - the town's best-known event, running into the new year.",
      },
      {
        name: "Winter Gardens & Opera House",
        note: "A Victorian entertainment complex still hosting touring shows and conferences inside genuinely ornate interiors.",
      },
    ],
    eat: [
      {
        name: "The Cottage Restaurant, Queen Street",
        note: "A long-standing sit-down fish and chip restaurant, a step up from a seafront takeaway.",
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
      },
      {
        name: "Blackpool Zoo",
        note: "Set back in Stanley Park, with elephants, orangutans and a safari-style layout.",
      },
      {
        name: "SEA LIFE Blackpool",
        note: "An aquarium beneath the Promenade with a walk-through ocean tunnel.",
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
      },
    ],
    pubsAndNightlife: [
      {
        name: "The Syndicate, Church Street",
        note: "One of the UK's largest nightclubs, a genuine Blackpool nightlife landmark.",
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
      },
      {
        name: "Coral Island",
        note: "An amusement arcade and gift-shop landmark on the Golden Mile, a Blackpool fixture for decades.",
      },
      {
        name: "Abingdon Street Market",
        note: "An indoor market for gifts, seaside novelties and local produce.",
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
      { name: "Sandcastle Waterpark", note: "Indoor and warm, whatever the weather outside." },
      { name: "Madame Tussauds Blackpool", note: "A fully indoor seafront attraction on the Golden Mile." },
      { name: "SEA LIFE Blackpool", note: "Another reliable indoor option right on the Promenade." },
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

  "lytham-st-annes": {
    insiderTip:
      "Lytham Green on a summer evening, with the tide in and the windmill lit up, is this coast's best-kept secret - most visitors never get past Blackpool to see it.",
    thingsToDo: [
      {
        name: "Lytham Windmill",
        note: "A working windmill on Lytham Green, one of the coast's most-photographed landmarks.",
      },
      {
        name: "Royal Lytham & St Annes Golf Club",
        note: "A genuine Open Championship course - even non-golfers will recognise the name.",
      },
      {
        name: "Lowther Pavilion",
        note: "Lytham's own theatre, with a year-round programme of shows and touring productions.",
      },
    ],
    eat: [
      {
        name: "Clifton Street, Lytham",
        note: "The town's main strip for independent dining, from bistros to seafood.",
      },
      {
        name: "Seafront fish restaurants, St Annes",
        note: "A reliable catch-of-the-day option close to the beach.",
      },
      {
        name: "The Taps, Henry Street, Lytham",
        note: "A well-known real ale pub that also serves food.",
      },
    ],
    coffeeAndBreakfast: [
      {
        name: "Clifton Street and Park Street, Lytham",
        note: "The town's boutique-shopping-and-coffee strip - a proper morning out, not just a stop.",
      },
      {
        name: "Wood Street, St Annes",
        note: "A quieter, more local breakfast scene than the seafront.",
      },
      {
        name: "Ashton Gardens café, St Annes",
        note: "A good stop if you're already walking the gardens.",
      },
    ],
    family: [
      {
        name: "Fairhaven Lake, St Annes",
        note: "Pedal boats and a model boating lake, with a park alongside for a full day out.",
      },
      {
        name: "St Annes beach",
        note: "Wide, flat sand backed by dunes, generally quieter than Blackpool's.",
      },
      {
        name: "Lowther Pavilion",
        note: "Family-friendly matinees and a pantomime season alongside its main programme.",
      },
    ],
    beachesAndWalks: [
      {
        name: "St Annes beach and sand dunes",
        note: "A long, quieter stretch of coast with a nature reserve behind the dunes.",
      },
      {
        name: "Lytham Green",
        note: "A large open green running along the estuary, popular for a flat evening stroll.",
      },
      {
        name: "The coastal path to Fairhaven Lake",
        note: "Links the green, the lake and the beach in one easy walk.",
      },
    ],
    pubsAndNightlife: [
      { name: "The Taps, Lytham", note: "A long-standing real ale pub, popular with locals." },
      { name: "Clifton Arms Hotel, Lytham", note: "A traditional hotel bar right on the green." },
      {
        name: "St Annes' seafront bars",
        note: "A calmer, more grown-up nightlife scene than Blackpool's.",
      },
    ],
    shopping: [
      {
        name: "Clifton Street and Park Street, Lytham",
        note: "Independent boutiques, gift shops and delis.",
      },
      { name: "Wood Street, St Annes", note: "Another strip of independent shops, generally quieter." },
      {
        name: "Booths, Lytham",
        note: "The Northern regional chain's own take on a food shop - popular for something a bit more upmarket than a standard supermarket.",
      },
    ],
    amenities: [
      { name: "Local GP surgeries and health centres", note: "Serve both Lytham and St Annes directly." },
      {
        name: "Pharmacies along Clifton Street and Wood Street",
        note: "Cover both town centres.",
      },
      {
        name: "Supermarkets and high-street banks",
        note: "Lytham and St Annes each have their own.",
      },
    ],
    transport: [
      {
        name: "Lytham and Ansdell & Fairhaven railway stations",
        note: "Connect to Preston and onward to the wider rail network.",
      },
      {
        name: "St Annes-on-the-Sea railway station",
        note: "Sits right by the town centre.",
      },
      {
        name: "Coast-road bus routes",
        note: "Regular services link Lytham and St Annes to Blackpool.",
      },
    ],
    parking: [
      {
        name: "Pay-and-display parking along Lytham Green and the St Annes seafront",
        note: "The main options in both towns.",
      },
      {
        name: "On-street parking away from the green",
        note: "More available here than in central Blackpool.",
      },
      { name: "Fairhaven Lake car park", note: "Useful for a family day out at the lake." },
    ],
    dogFriendly: [
      {
        name: "St Annes beach and dunes",
        note: "A popular, spacious dog walk with year-round access on most stretches.",
      },
      {
        name: "Lytham Green",
        note: "Wide open space that's easy walking for dogs - check local signage for any lead-only areas.",
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
        name: "Ashton Gardens, St Annes",
        note: "A quiet, formal park many day-trippers never reach.",
      },
      {
        name: "The far end of Lytham Green",
        note: "Saltmarsh views over the Ribble estuary, away from the main green.",
      },
    ],
    rainyDay: [
      { name: "Lowther Pavilion", note: "A full indoor programme of shows whatever the weather." },
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
        note: "Royal Lytham & St Annes hosts it on rotation - a huge date for the town when it does.",
      },
      {
        name: "St Annes Carnival",
        note: "A summer seafront event with its own programme through the season.",
      },
    ],
  },

  cleveleys: {
    insiderTip:
      "Cleveleys is what Blackpool's seafront would look like if you took away the crowds and kept the sea view - worth the short tram ride even if you're staying further south.",
    thingsToDo: [
      {
        name: "Cleveleys Promenade",
        note: "A striking, redesigned seafront with modern shelters and open lawns, distinct from Blackpool's.",
      },
      {
        name: "Anchorsholme Park",
        note: "A splash park, skate park and open green space right by the coast.",
      },
      {
        name: "Jubilee Gardens",
        note: "Landscaped seafront gardens - a quieter spot for a sit-down and a view.",
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
      { name: "Cleveleys Market", note: "A small local market held periodically in the town centre." },
      {
        name: "Everyday shops around the town centre",
        note: "A short walk from the seafront.",
      },
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
      { name: "Anchorsholme Park car park", note: "For families visiting the splash park." },
    ],
    dogFriendly: [
      {
        name: "Cleveleys beach",
        note: "Dog-friendly on most stretches outside peak summer restrictions.",
      },
      {
        name: "Anchorsholme Park",
        note: "Plenty of open grass for dog walking alongside the splash park.",
      },
      { name: "Promenade cafés", note: "Several allow dogs at outside tables." },
    ],
    hiddenGems: [
      {
        name: "Rossall Point Tower",
        note: "A striking modern coastal observation tower most visitors never walk far enough north to find.",
      },
      { name: "Jubilee Gardens' quieter corners", note: "Away from the main Promenade benches." },
      {
        name: "Sunset on the northern Promenade",
        note: "A clear view back towards Blackpool Tower.",
      },
    ],
    rainyDay: [
      { name: "Victoria Road West cafés and shops", note: "An easy indoor afternoon." },
      { name: "A short tram ride into Blackpool", note: "For its indoor attractions." },
      {
        name: "Cleveleys Library and community centre",
        note: "Occasionally host events worth checking ahead of a wet day.",
      },
    ],
    events: [
      { name: "Cleveleys Carnival", note: "A local summer event with a parade along the seafront." },
      { name: "Seasonal markets", note: "Held on Victoria Road West through the year." },
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
      },
      {
        name: "Fleetwood's twin lighthouses",
        note: "The Lower and Upper Lighthouses, both distinctive 1840s landmarks designed by Decimus Burton.",
      },
      {
        name: "The Fleetwood-Knott End ferry",
        note: "A short foot-passenger ferry crossing the mouth of the River Wyre.",
      },
    ],
    eat: [
      {
        name: "Fleetwood Market",
        note: "As much a place to eat as to shop, with food stalls alongside the market traders.",
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
      { name: "Cafés in and around Fleetwood Market", note: "The town's main breakfast spot." },
      { name: "Marine Hall café", note: "Overlooks the seafront gardens." },
      {
        name: "Independent coffee shops",
        note: "Along the town's main shopping streets.",
      },
    ],
    family: [
      {
        name: "Marine Hall and Gardens",
        note: "Seafront gardens with occasional family events and a paddling pool in summer.",
      },
      {
        name: "Fleetwood Museum",
        note: "Hands-on maritime exhibits that tend to hold children's attention well.",
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
      },
      {
        name: "The outlet shopping village near the docks",
        note: "Built on the site of the old Freeport development - worth checking current tenants before a special trip.",
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
      },
      {
        name: "The Knott End ferry crossing",
        note: "A five-minute trip most coast visitors never think to take.",
      },
      {
        name: "Fleetwood Museum's smaller exhibits",
        note: "The town's trawling-disaster displays are easy to miss but genuinely moving.",
      },
    ],
    rainyDay: [
      { name: "Fleetwood Museum", note: "Fully indoors and covers a good hour or two." },
      { name: "Fleetwood Market's indoor hall", note: "A dry way to spend a wet morning." },
      {
        name: "The outlet shopping village near the docks",
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

  bispham: {
    insiderTip:
      "Stay in Bispham if you want Blackpool's attractions without Blackpool's noise - the tram gets you there in minutes, but you come home to a quiet clifftop.",
    thingsToDo: [
      {
        name: "Bispham cliffs and coastal path",
        note: "One of the higher points on this stretch of coast, with long sea views.",
      },
      {
        name: "St Andrew's Church, Bispham",
        note: "One of the older buildings on the Fylde Coast, worth a look if you're passing.",
      },
      {
        name: "Easy tram access to Blackpool",
        note: "Bispham's tram stop puts the Tower, Pleasure Beach and Illuminations a few minutes away.",
      },
    ],
    eat: [
      {
        name: "Red Bank Road",
        note: "A small cluster of cafés and takeaways forming Bispham's local high street.",
      },
      {
        name: "Clifftop path kiosks",
        note: "For a quick coffee or ice cream on a walk.",
      },
      {
        name: "For a bigger meal out",
        note: "Most sit-down dining is a short tram ride into Blackpool or Cleveleys.",
      },
    ],
    coffeeAndBreakfast: [
      { name: "Cafés along Red Bank Road", note: "Bispham's own small breakfast scene." },
      {
        name: "Clifftop café stops",
        note: "Popular with dog walkers and runners on the coastal path.",
      },
      {
        name: "A short tram ride",
        note: "Reaches a much wider choice in Cleveleys or Blackpool.",
      },
    ],
    family: [
      {
        name: "The clifftop lawns and paths",
        note: "Safe, open space for younger children away from traffic.",
      },
      {
        name: "Blackpool's family attractions",
        note: "Sandcastle Waterpark, the Zoo and SEA LIFE Centre are all a short tram ride away.",
      },
      {
        name: "Anchorsholme Park splash park",
        note: "A short walk or drive north into Cleveleys.",
      },
    ],
    beachesAndWalks: [
      {
        name: "Bispham's beach, below the cliffs",
        note: "Quieter than central Blackpool, reached by steps or slopes down from the clifftop.",
      },
      {
        name: "The clifftop coastal path",
        note: "One of the more scenic stretches of the whole Fylde Coast walk.",
      },
      {
        name: "Continue further",
        note: "The path runs south into Blackpool or north into Cleveleys for a longer walk.",
      },
    ],
    pubsAndNightlife: [
      { name: "Local pubs around Red Bank Road", note: "A small, genuinely local selection." },
      {
        name: "For nightlife",
        note: "Bispham is a quiet residential base - most nightlife is a short tram ride into Blackpool.",
      },
    ],
    shopping: [
      { name: "Everyday shops along Red Bank Road", note: "Cover day-to-day essentials." },
      {
        name: "Bigger shopping trips",
        note: "Head into Blackpool's Houndshill Centre or Cleveleys' Victoria Road West, both a short tram ride away.",
      },
    ],
    amenities: [
      { name: "A local pharmacy and shops", note: "Serve Red Bank Road." },
      {
        name: "Larger amenities",
        note: "Supermarkets, GP surgeries and the hospital are a short tram or drive into Blackpool.",
      },
    ],
    transport: [
      {
        name: "Bispham tram stop",
        note: "On the main Blackpool Tramway, with frequent services in both directions.",
      },
      {
        name: "Coast-road bus routes",
        note: "Connect Bispham to Blackpool and Cleveleys.",
      },
    ],
    parking: [
      {
        name: "On-street and pay-and-display parking",
        note: "Near the clifftop and Red Bank Road, generally easier than central Blackpool.",
      },
      {
        name: "Clifftop car parks",
        note: "Fill up on sunny weekends - arrive earlier for a sea-view space.",
      },
    ],
    dogFriendly: [
      {
        name: "The clifftop path",
        note: "One of the most popular dog walks on this stretch of coast, with sea views the whole way.",
      },
      {
        name: "Bispham's beach below the cliffs",
        note: "Generally quieter and easier for dogs than central Blackpool.",
      },
    ],
    hiddenGems: [
      {
        name: "The clifftop path at sunset",
        note: "Looking north over Cleveleys and south towards Blackpool Tower.",
      },
      {
        name: "Bispham's relative quiet",
        note: "Most visitors pass straight through on the tram without ever stopping.",
      },
    ],
    rainyDay: [
      {
        name: "A short tram ride into Blackpool",
        note: "Reaches Sandcastle Waterpark, SEA LIFE and Madame Tussauds.",
      },
      { name: "Cafés along Red Bank Road", note: "A slower, indoor pace close to home." },
    ],
    events: [
      {
        name: "Blackpool Illuminations",
        note: "Extend along parts of Bispham's clifftop stretch.",
      },
      {
        name: "Larger events",
        note: "Carnivals, air shows and markets are mostly a short tram ride away in Blackpool, Cleveleys or Fleetwood.",
      },
    ],
  },
};

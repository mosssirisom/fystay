import { Baby, CloudRain, Heart, Sun, UtensilsCrossed, Waves, type LucideIcon } from "lucide-react";

/**
 * Ready-made itineraries per town - the brief's "Perfect Days". Every step
 * is assembled from places and streets the rest of the Local Guide already
 * names (localGuide.ts) rather than new facts invented for this feature:
 * this is curation (a sensible order to see real things in) not a new
 * source of claims about opening times, quality or availability.
 */

export type PerfectDayKey = "family" | "couples" | "beach" | "foodie" | "rainy" | "relaxed";

export const PERFECT_DAY_META: { key: PerfectDayKey; label: string; icon: LucideIcon }[] = [
  { key: "family", label: "Family Day", icon: Baby },
  { key: "couples", label: "Couples Day", icon: Heart },
  { key: "beach", label: "Beach Day", icon: Waves },
  { key: "foodie", label: "Foodie Day", icon: UtensilsCrossed },
  { key: "rainy", label: "Rainy Day", icon: CloudRain },
  { key: "relaxed", label: "Relaxed Day", icon: Sun },
];

export type ItineraryStep = {
  time: "Morning" | "Midday" | "Afternoon" | "Evening";
  activity: string;
  /** Key into src/lib/placeCoordinates.ts, set only when this step names one real, identifiable place - same convention as GuideEntry.place. */
  place?: string;
};

export type PerfectDay = {
  key: PerfectDayKey;
  steps: ItineraryStep[];
};

export const PERFECT_DAYS: Record<string, PerfectDay[]> = {
  blackpool: [
    {
      key: "family",
      steps: [
        { time: "Morning", activity: "Blackpool Tower & Tower Eye", place: "Blackpool Tower" },
        { time: "Midday", activity: "Lunch at the Big Blue Hotel restaurant, right by Pleasure Beach" },
        { time: "Afternoon", activity: "Rides at Pleasure Beach Blackpool", place: "Blackpool Pleasure Beach" },
        { time: "Evening", activity: "A stroll along the Promenade - the Illuminations if you're here in season" },
      ],
    },
    {
      key: "couples",
      steps: [
        { time: "Morning", activity: "Winter Gardens & Opera House's Victorian interiors", place: "Winter Gardens Blackpool" },
        { time: "Midday", activity: "Lunch at The Cottage Restaurant, Queen Street" },
        { time: "Afternoon", activity: "A walk through Stanley Park's Italian Gardens", place: "Stanley Park Blackpool" },
        { time: "Evening", activity: "Blackpool Tower Eye at dusk, then a walk down the Golden Mile", place: "Blackpool Tower" },
      ],
    },
    {
      key: "beach",
      steps: [
        { time: "Morning", activity: "Blackpool's main beach, a couple of hours either side of low tide" },
        { time: "Midday", activity: "Fish and chips on Bonny Street" },
        { time: "Afternoon", activity: "The Promenade on foot or bike, the tram-lined length of the resort" },
        { time: "Evening", activity: "Sandcastle Waterpark if the tide's wrong or the weather turns", place: "Sandcastle Waterpark" },
      ],
    },
    {
      key: "foodie",
      steps: [
        { time: "Morning", activity: "Breakfast at a North Shore seafront café" },
        { time: "Midday", activity: "The Cottage Restaurant, Queen Street, for fish and chips done properly" },
        { time: "Afternoon", activity: "Abingdon Street Market for seaside treats and local produce" },
        { time: "Evening", activity: "A drink in the Winter Gardens' Spanish Hall", place: "Winter Gardens Blackpool" },
      ],
    },
    {
      key: "rainy",
      steps: [
        { time: "Morning", activity: "Sandcastle Waterpark - indoor and warm whatever the sky's doing", place: "Sandcastle Waterpark" },
        { time: "Midday", activity: "Lunch inside Houndshill Shopping Centre", place: "Houndshill Shopping Centre" },
        { time: "Afternoon", activity: "SEA LIFE Blackpool's walk-through ocean tunnel", place: "SEA LIFE Blackpool" },
        { time: "Evening", activity: "Madame Tussauds Blackpool" },
      ],
    },
    {
      key: "relaxed",
      steps: [
        { time: "Morning", activity: "Stanley Park's boating lake", place: "Stanley Park Blackpool" },
        { time: "Midday", activity: "Coffee at a Church Street café" },
        { time: "Afternoon", activity: "A slow walk the length of the Promenade" },
        { time: "Evening", activity: "An early, quiet seafront pub" },
      ],
    },
  ],

  lytham: [
    {
      key: "family",
      steps: [
        { time: "Morning", activity: "A family show at Lowther Pavilion, if one's on", place: "Lowther Pavilion" },
        { time: "Midday", activity: "Lunch on Clifton Street, Lytham" },
        { time: "Afternoon", activity: "Lytham Hall's parkland - space to run around", place: "Lytham Hall" },
        { time: "Evening", activity: "A slow walk around Lytham Green, watching the estuary" },
      ],
    },
    {
      key: "couples",
      steps: [
        { time: "Morning", activity: "Lytham Windmill and a walk round the green", place: "Lytham Windmill" },
        { time: "Midday", activity: "Lunch at a Clifton Street bistro" },
        { time: "Afternoon", activity: "Lytham Hall's parkland trails", place: "Lytham Hall" },
        { time: "Evening", activity: "Sunset by the windmill, then dinner at The Taps", place: "Lytham Windmill" },
      ],
    },
    {
      key: "beach",
      steps: [
        { time: "Morning", activity: "Lytham Green at low tide, watching the estuary" },
        { time: "Midday", activity: "Lunch on Clifton Street" },
        { time: "Afternoon", activity: "The coastal path towards St Annes beach" },
        { time: "Evening", activity: "Golden hour by the windmill", place: "Lytham Windmill" },
      ],
    },
    {
      key: "foodie",
      steps: [
        { time: "Morning", activity: "Breakfast on Clifton Street" },
        { time: "Midday", activity: "Lunch at The Taps, Henry Street" },
        { time: "Afternoon", activity: "Booths, Lytham, for something to take home" },
        { time: "Evening", activity: "Dinner at a Clifton Street bistro" },
      ],
    },
    {
      key: "rainy",
      steps: [
        { time: "Morning", activity: "Whatever's on at Lowther Pavilion", place: "Lowther Pavilion" },
        { time: "Midday", activity: "Lunch at the Booths café, Lytham" },
        { time: "Afternoon", activity: "Lytham Hall's house open day, if one's on", place: "Lytham Hall" },
        { time: "Evening", activity: "A Clifton Street pub that serves food" },
      ],
    },
    {
      key: "relaxed",
      steps: [
        { time: "Morning", activity: "A slow lap of Lytham Hall's parkland", place: "Lytham Hall" },
        { time: "Midday", activity: "Coffee on Clifton Street" },
        { time: "Afternoon", activity: "Lytham Green, watching the estuary" },
        { time: "Evening", activity: "A drink at the Clifton Arms Hotel, right on the green" },
      ],
    },
  ],

  "st-annes": [
    {
      key: "family",
      steps: [
        { time: "Morning", activity: "Pedal boats on Fairhaven Lake", place: "Fairhaven Lake" },
        { time: "Midday", activity: "Lunch on Wood Street" },
        { time: "Afternoon", activity: "St Annes beach and the dunes" },
        { time: "Evening", activity: "St Annes Pier's amusements", place: "St Annes Pier" },
      ],
    },
    {
      key: "couples",
      steps: [
        { time: "Morning", activity: "Ashton Gardens' lake and aviary", place: "Ashton Gardens" },
        { time: "Midday", activity: "Lunch on Wood Street" },
        { time: "Afternoon", activity: "The coastal path from St Annes to Fairhaven Lake", place: "Fairhaven Lake" },
        { time: "Evening", activity: "Sunset near Fairhaven, then dinner at a seafront restaurant", place: "Fairhaven Lake" },
      ],
    },
    {
      key: "beach",
      steps: [
        { time: "Morning", activity: "St Annes beach and the sand dunes" },
        { time: "Midday", activity: "A seafront fish restaurant in St Annes" },
        { time: "Afternoon", activity: "The coastal path between St Annes and Lytham" },
        { time: "Evening", activity: "Golden hour at Fairhaven Lake", place: "Fairhaven Lake" },
      ],
    },
    {
      key: "foodie",
      steps: [
        { time: "Morning", activity: "Breakfast on Wood Street" },
        { time: "Midday", activity: "A seafront fish restaurant" },
        { time: "Afternoon", activity: "Ashton Gardens café", place: "Ashton Gardens" },
        { time: "Evening", activity: "Dinner on Wood Street" },
      ],
    },
    {
      key: "rainy",
      steps: [
        { time: "Morning", activity: "Ashton Gardens' aviary", place: "Ashton Gardens" },
        { time: "Midday", activity: "Lunch on Wood Street" },
        { time: "Afternoon", activity: "St Annes Pier's amusements", place: "St Annes Pier" },
        { time: "Evening", activity: "A Wood Street pub that serves food" },
      ],
    },
    {
      key: "relaxed",
      steps: [
        { time: "Morning", activity: "A slow lap of Ashton Gardens' lake", place: "Ashton Gardens" },
        { time: "Midday", activity: "Coffee on Wood Street" },
        { time: "Afternoon", activity: "Fairhaven Lake, watching the boats", place: "Fairhaven Lake" },
        { time: "Evening", activity: "A quiet seafront bar" },
      ],
    },
  ],

  "poulton-le-fylde": [
    {
      key: "family",
      steps: [
        { time: "Morning", activity: "Poulton Market's Monday stalls, if it's on" },
        { time: "Midday", activity: "Lunch on Market Place" },
        { time: "Afternoon", activity: "Wyre Estuary Country Park at Stanah", place: "Wyre Estuary Country Park" },
        { time: "Evening", activity: "An easy dinner back at the Teanlowe Centre", place: "Teanlowe Centre" },
      ],
    },
    {
      key: "couples",
      steps: [
        { time: "Morning", activity: "The market cross, stocks and St Chad's Church", place: "St Chad's Church Poulton" },
        { time: "Midday", activity: "Lunch at The Golden Ball, Ball Street" },
        { time: "Afternoon", activity: "The Wyre Way to Skippool Creek", place: "Wyre Estuary Country Park" },
        { time: "Evening", activity: "A quiet pub back in the town centre" },
      ],
    },
    {
      key: "beach",
      steps: [
        { time: "Morning", activity: "There isn't one here - the Wyre Way instead, towards Skippool Creek", place: "Wyre Estuary Country Park" },
        { time: "Midday", activity: "Lunch on Market Place" },
        { time: "Afternoon", activity: "A short train or drive to Cleveleys' beach for the afternoon" },
        { time: "Evening", activity: "Back to Poulton for dinner on Ball Street" },
      ],
    },
    {
      key: "foodie",
      steps: [
        { time: "Morning", activity: "Breakfast on Market Place" },
        { time: "Midday", activity: "Lunch at The Golden Ball, Ball Street" },
        { time: "Afternoon", activity: "Teanlowe Centre's independent food shops", place: "Teanlowe Centre" },
        { time: "Evening", activity: "Dinner in the town centre" },
      ],
    },
    {
      key: "rainy",
      steps: [
        { time: "Morning", activity: "Teanlowe Centre", place: "Teanlowe Centre" },
        { time: "Midday", activity: "Lunch there too, out of the weather" },
        { time: "Afternoon", activity: "St Chad's Church, if it's open", place: "St Chad's Church Poulton" },
        { time: "Evening", activity: "A town-centre pub" },
      ],
    },
    {
      key: "relaxed",
      steps: [
        { time: "Morning", activity: "A slow walk along the Wyre Way to Skippool Creek", place: "Wyre Estuary Country Park" },
        { time: "Midday", activity: "Coffee on Market Place" },
        { time: "Afternoon", activity: "The market square and churchyard, at a slow pace" },
        { time: "Evening", activity: "A quiet pint at The Golden Ball, Ball Street" },
      ],
    },
  ],

  "thornton-cleveleys": [
    {
      key: "family",
      steps: [
        { time: "Morning", activity: "Anchorsholme Park's splash park", place: "Anchorsholme Park" },
        { time: "Midday", activity: "Lunch on Victoria Road West" },
        { time: "Afternoon", activity: "Cleveleys beach" },
        { time: "Evening", activity: "The tram to Blackpool or Fleetwood for a change of scene" },
      ],
    },
    {
      key: "couples",
      steps: [
        { time: "Morning", activity: "A walk along Cleveleys Promenade's redesigned seafront" },
        { time: "Midday", activity: "Lunch at a Rossall independent restaurant" },
        { time: "Afternoon", activity: "A quiet sit-down in Jubilee Gardens", place: "Jubilee Gardens Cleveleys" },
        { time: "Evening", activity: "Sunset on the northern Promenade, looking back towards Blackpool Tower" },
      ],
    },
    {
      key: "beach",
      steps: [
        { time: "Morning", activity: "Cleveleys beach, walking north towards Rossall" },
        { time: "Midday", activity: "Fish and chips on the Promenade" },
        { time: "Afternoon", activity: "Anchorsholme Park's splash park if you've kids with you", place: "Anchorsholme Park" },
        { time: "Evening", activity: "Rossall Point Tower for the view back down the coast", place: "Rossall Point Tower" },
      ],
    },
    {
      key: "foodie",
      steps: [
        { time: "Morning", activity: "Breakfast on Victoria Road West" },
        { time: "Midday", activity: "Lunch at a Rossall independent restaurant" },
        { time: "Afternoon", activity: "Cleveleys Market, if it's on" },
        { time: "Evening", activity: "Dinner on Victoria Road West" },
      ],
    },
    {
      key: "rainy",
      steps: [
        { time: "Morning", activity: "Victoria Road West's cafés and shops" },
        { time: "Midday", activity: "Lunch there too, out of the weather" },
        { time: "Afternoon", activity: "Marsh Mill Village's craft shops, Thornton", place: "Marsh Mill" },
        { time: "Evening", activity: "Whatever's on at Thornton Little Theatre" },
      ],
    },
    {
      key: "relaxed",
      steps: [
        { time: "Morning", activity: "Jubilee Gardens", place: "Jubilee Gardens Cleveleys" },
        { time: "Midday", activity: "Coffee on Victoria Road West" },
        { time: "Afternoon", activity: "A flat, unhurried walk along the Promenade" },
        { time: "Evening", activity: "A quiet seafront bar" },
      ],
    },
  ],

  fleetwood: [
    {
      key: "family",
      steps: [
        { time: "Morning", activity: "Fleetwood Museum's hands-on maritime exhibits", place: "Fleetwood Museum" },
        { time: "Midday", activity: "Lunch among the food stalls at Fleetwood Market", place: "Fleetwood Market" },
        { time: "Afternoon", activity: "Marine Hall and Gardens - the paddling pool in summer", place: "Marine Hall" },
        { time: "Evening", activity: "The tram back down the whole line to Blackpool" },
      ],
    },
    {
      key: "couples",
      steps: [
        { time: "Morning", activity: "Fleetwood's twin lighthouses", place: "Fleetwood Pharos Lighthouse" },
        { time: "Midday", activity: "A seafront fish and chip restaurant" },
        { time: "Afternoon", activity: "The Fleetwood-Knott End ferry crossing", place: "Fleetwood Ferry" },
        { time: "Evening", activity: "A quiet pub near the Esplanade" },
      ],
    },
    {
      key: "beach",
      steps: [
        { time: "Morning", activity: "Fleetwood beach and the Esplanade" },
        { time: "Midday", activity: "Lunch at Fleetwood Market", place: "Fleetwood Market" },
        { time: "Afternoon", activity: "The Wyre estuary path" },
        { time: "Evening", activity: "The lighthouses at dusk", place: "Fleetwood Pharos Lighthouse" },
      ],
    },
    {
      key: "foodie",
      steps: [
        { time: "Morning", activity: "Breakfast at a Fleetwood Market café", place: "Fleetwood Market" },
        { time: "Midday", activity: "A genuine seafront fish and chip restaurant" },
        { time: "Afternoon", activity: "Back to the Market's food stalls for something to take home", place: "Fleetwood Market" },
        { time: "Evening", activity: "A town-centre restaurant near the Market" },
      ],
    },
    {
      key: "rainy",
      steps: [
        { time: "Morning", activity: "Fleetwood Museum", place: "Fleetwood Museum" },
        { time: "Midday", activity: "Lunch in Fleetwood Market's indoor hall", place: "Fleetwood Market" },
        { time: "Afternoon", activity: "The outlet shopping village near the docks" },
        { time: "Evening", activity: "A town-centre pub" },
      ],
    },
    {
      key: "relaxed",
      steps: [
        { time: "Morning", activity: "Marine Hall and Gardens", place: "Marine Hall" },
        { time: "Midday", activity: "Coffee at the Marine Hall café", place: "Marine Hall" },
        { time: "Afternoon", activity: "The Knott End ferry, there and back", place: "Fleetwood Ferry" },
        { time: "Evening", activity: "A seafront pub near the Esplanade" },
      ],
    },
  ],

};

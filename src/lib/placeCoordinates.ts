/**
 * Canonical coordinates for real, named Fylde Coast places - the single
 * source every distance-from-a-listing calculation in the app reads from
 * (src/lib/landmarks.ts's "Getting around" callout, and the Local Guide /
 * Local Knowledge's location-aware distance badges), so the same real
 * place never ends up with two slightly different remembered coordinates.
 *
 * Coordinates are drawn from general geographic knowledge of well-known
 * public landmarks, not a verified geocoding lookup - close enough for
 * "about a mile away", not survey-grade. Only genuinely singular,
 * identifiable places belong here: a specific street, a market's general
 * area, or "independent shops nearby" isn't one point and shouldn't be
 * forced into having invented coordinates - a guide entry that doesn't
 * name one of these places simply doesn't get a distance badge, rather
 * than getting a guessed one.
 */
export const PLACE_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  // Blackpool
  "Blackpool Tower": { latitude: 53.8142, longitude: -3.0553 },
  "Blackpool Pleasure Beach": { latitude: 53.7877, longitude: -3.0522 },
  "North Pier": { latitude: 53.8168, longitude: -3.0592 },
  "Blackpool North": { latitude: 53.8168, longitude: -3.048 },
  "Winter Gardens Blackpool": { latitude: 53.8151, longitude: -3.0522 },
  "Sandcastle Waterpark": { latitude: 53.7883, longitude: -3.0503 },
  "Blackpool Zoo": { latitude: 53.8087, longitude: -3.0031 },
  "SEA LIFE Blackpool": { latitude: 53.8157, longitude: -3.0558 },
  "Houndshill Shopping Centre": { latitude: 53.8163, longitude: -3.0525 },
  "Grundy Art Gallery": { latitude: 53.8175, longitude: -3.0505 },
  "Stanley Park Blackpool": { latitude: 53.8087, longitude: -3.0225 },
  "Comedy Carpet": { latitude: 53.8146, longitude: -3.0558 },
  "The Syndicate Blackpool": { latitude: 53.8159, longitude: -3.0524 },

  // Lytham St Annes
  "Lytham Windmill": { latitude: 53.7423, longitude: -2.9611 },
  "St Annes Pier": { latitude: 53.7529, longitude: -3.0335 },
  "Fairhaven Lake": { latitude: 53.7469, longitude: -3.0035 },
  Lytham: { latitude: 53.7423, longitude: -2.9583 },
  "Ansdell & Fairhaven": { latitude: 53.7457, longitude: -2.9814 },
  "Lowther Pavilion": { latitude: 53.7443, longitude: -2.9633 },
  "Ashton Gardens": { latitude: 53.7508, longitude: -3.0289 },
  "Royal Lytham & St Annes Golf Club": { latitude: 53.7398, longitude: -3.0074 },

  // Fleetwood
  "Fleetwood Pharos Lighthouse": { latitude: 53.9256, longitude: -3.0113 },
  "Fleetwood Ferry": { latitude: 53.9268, longitude: -3.0068 },
  "Poulton-le-Fylde": { latitude: 53.8483, longitude: -2.9883 },
  "Fleetwood Museum": { latitude: 53.9236, longitude: -3.0084 },
  "Marine Hall": { latitude: 53.9203, longitude: -3.0097 },
  "Fleetwood Market": { latitude: 53.9224, longitude: -3.0117 },

  // Cleveleys
  "Rossall Point Tower": { latitude: 53.9021, longitude: -3.0247 },
  "Anchorsholme Park": { latitude: 53.8654, longitude: -3.0472 },
  "Jubilee Gardens Cleveleys": { latitude: 53.8767, longitude: -3.0507 },

  // Bispham
  "Bispham Tramway Stop": { latitude: 53.8459, longitude: -3.0453 },
  "St Andrew's Church Bispham": { latitude: 53.8453, longitude: -3.0417 },
};

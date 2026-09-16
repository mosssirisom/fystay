import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeBookingPricing } from "@/lib/pricing";
import { generateBookingReference } from "@/lib/bookingReference";
import { geocodeListing } from "@/lib/geocoding";
import { generateReferralCode } from "@/lib/referral";

/**
 * Shared by prisma/seed.ts (local `npm run db:seed`) and the admin-only
 * POST /api/admin/seed-demo-data route (for populating a real deployed
 * environment through the app's own DATABASE_URL, without anyone needing
 * a direct database connection) - one source of truth for the demo
 * dataset instead of two copies drifting apart.
 *
 * Every listing/review/provider write here is idempotent (checked by
 * title/email/name before creating), so calling this repeatedly - most
 * realistically via the admin route, more than once - never duplicates
 * data.
 */

// Seed listings ship with generated placeholder art instead of hotlinked
// stock photos: it renders instantly with zero external requests, so the
// demo never depends on a third-party image host being reachable. Every
// entry stays in the same warm terracotta/amber/rust/umber/wine family as
// the brand palette (globals.css) - no green or blue, which read as an
// off-brand cold contrast against the site's warm parchment background.
const PALETTES: [string, string][] = [
  ["#d97757", "#954328"],
  ["#f59e0b", "#b45309"],
  ["#c2622a", "#7a3a17"],
  ["#a34b4b", "#5c2323"],
  ["#8a5a3b", "#4a3220"],
];

function hashCode(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Line-art glyphs (24x24 viewBox, same stroke language as the lucide icons
// used everywhere else in the app) standing in for a property's photos.
// "house" reuses the brand mark itself for city apartments/lofts.
type PlaceholderIcon = "house" | "lighthouse" | "waves" | "star";

const ICON_PATHS: Record<PlaceholderIcon, string[]> = {
  house: [
    "M3 11.5L12 4l9 7.5",
    "M5.5 10v9a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1v-9",
  ],
  lighthouse: [
    "M9 21V10a3 3 0 0 1 3-3 3 3 0 0 1 3 3v11",
    "M9.5 14h5",
    "M7 21h10",
  ],
  waves: [
    "M2 9c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0",
    "M2 15c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0",
  ],
  // The premium listings (see DEMO_LISTINGS below) - a distinct glyph so
  // they read as a different tier at a glance rather than just a higher
  // price tag on an otherwise identical card.
  star: [
    "M12 3l2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20l1.4-6.3-4.8-4.3 6.4-.6z",
  ],
};

function iconMarkup(icon: PlaceholderIcon): string {
  const size = 320; // rendered icon box, in canvas pixels
  const scale = size / 24;
  const tx = 600 - size / 2;
  const ty = 450 - size / 2;
  const paths = ICON_PATHS[icon]
    .map((d) => `<path d="${d}" />`)
    .join("");
  return `<g transform="translate(${tx} ${ty}) scale(${scale})" fill="none" stroke="white" stroke-opacity="0.28" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
}

function placeholderPhoto(seedText: string, index: number, icon: PlaceholderIcon): string {
  const [from, to] = PALETTES[(hashCode(seedText) + index) % PALETTES.length];
  const angle = index % 2 === 0 ? "x1='0' y1='0' x2='1' y2='1'" : "x1='1' y1='0' x2='0' y2='1'";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
    <defs><linearGradient id="g" ${angle}>
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    ${iconMarkup(icon)}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function placeholderPhotos(seedText: string, count: number, icon: PlaceholderIcon): string[] {
  return Array.from({ length: count }, (_, i) => placeholderPhoto(seedText, i, icon));
}

export const DEMO_LISTINGS = [
  {
    title: "Seafront apartment overlooking Blackpool promenade",
    description:
      "Wake up to sea views right on Blackpool's famous promenade. Two minutes from the beach, five from the Tower, with the tram stop just outside.",
    city: "Blackpool",
    country: "England",
    propertyType: "APARTMENT" as const,
    pricePerNightCents: 7500,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    amenities: ["Wifi", "Kitchen", "Sea view", "Free parking"],
    placeholderIcon: "waves" as const,
    cancellationPolicy: "FLEXIBLE" as const,
  },
  {
    title: "Elegant Victorian townhouse in Lytham St Annes",
    description:
      "A beautifully restored townhouse two streets back from Lytham Green. High ceilings, a walled garden, and a five-minute stroll to the shops and windmill.",
    city: "Lytham St Annes",
    country: "England",
    propertyType: "HOUSE" as const,
    pricePerNightCents: 14500,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 2,
    amenities: ["Wifi", "Kitchen", "Garden", "Washer", "Free parking"],
    placeholderIcon: "house" as const,
    cancellationPolicy: "STRICT" as const,
  },
  {
    title: "Cosy cottage near Fleetwood Marina",
    description:
      "A snug fisherman's cottage a short walk from Fleetwood Marina and the historic lighthouses. Perfect for a quiet coastal break, with the Knott End ferry nearby.",
    city: "Fleetwood",
    country: "England",
    propertyType: "COTTAGE" as const,
    pricePerNightCents: 5800,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    amenities: ["Wifi", "Kitchen", "Washer", "Pet friendly"],
    placeholderIcon: "lighthouse" as const,
    cancellationPolicy: "CUSTOM" as const,
    customCancellationCutoffDays: 10,
    customCancellationRefundPercent: 75,
  },
  {
    title: "Beachfront studio in Cleveleys",
    description:
      "A bright, compact studio right on Cleveleys' open seafront - wake up to the tide out the window and walk straight onto the beach. A short tram ride from Blackpool without the crowds.",
    city: "Cleveleys",
    country: "England",
    propertyType: "STUDIO" as const,
    pricePerNightCents: 4200,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    amenities: ["Wifi", "Kitchen", "Sea view"],
    placeholderIcon: "waves" as const,
    cancellationPolicy: "FLEXIBLE" as const,
  },
  {
    title: "Clifftop garden apartment in Bispham",
    description:
      "A quiet ground-floor apartment with its own garden, set back from Bispham's clifftop gardens and coastal views. Blackpool's attractions and Cleveleys' seafront are both a short drive away.",
    city: "Bispham",
    country: "England",
    propertyType: "APARTMENT" as const,
    pricePerNightCents: 8900,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    amenities: ["Wifi", "Kitchen", "Garden", "Free parking"],
    placeholderIcon: "house" as const,
    cancellationPolicy: "MODERATE" as const,
  },
  {
    title: "Premium sea-view penthouse on Blackpool promenade",
    description:
      "A top-floor penthouse with floor-to-ceiling sea views the entire length of Blackpool's promenade. Private hot tub terrace, hotel-grade linens and finishes throughout, and a five-minute walk to the Tower. The most complete stay FYStay currently lists in Blackpool.",
    city: "Blackpool",
    country: "England",
    propertyType: "APARTMENT" as const,
    pricePerNightCents: 32000,
    cleaningFeeCents: 6000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 2,
    amenities: [
      "Wifi",
      "Sea view",
      "Hot tub",
      "Free parking",
      "Air conditioning",
      "Kitchen",
      "Washer",
      "Balcony",
      "Elevator access",
    ],
    placeholderIcon: "star" as const,
    cancellationPolicy: "MODERATE" as const,
  },
  {
    title: "Signature villa with private pool near Lytham St Annes",
    description:
      "A gated four-bedroom villa moments from the town's famous golf links, built around a heated pool and private hot tub terrace. Interior-designed throughout, with a chef's kitchen and a walled garden made for evenings outside.",
    city: "Lytham St Annes",
    country: "England",
    propertyType: "VILLA" as const,
    pricePerNightCents: 39000,
    cleaningFeeCents: 9000,
    maxGuests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    amenities: [
      "Wifi",
      "Pool",
      "Hot tub",
      "Kitchen",
      "Garden",
      "Free parking",
      "Air conditioning",
      "Washer",
      "Dryer",
      "BBQ grill",
      "Fireplace",
    ],
    placeholderIcon: "star" as const,
    cancellationPolicy: "STRICT" as const,
  },
  {
    title: "Designer duplex overlooking Fleetwood Marina",
    description:
      "An architect-renovated two-storey duplex with full-height glass looking straight down Fleetwood Marina to the water. Private hot tub balcony, hotel-grade finishes, and lift access - a short stroll from the lighthouses and the Knott End ferry.",
    city: "Fleetwood",
    country: "England",
    propertyType: "APARTMENT" as const,
    pricePerNightCents: 21000,
    cleaningFeeCents: 5000,
    maxGuests: 5,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    amenities: [
      "Wifi",
      "Sea view",
      "Hot tub",
      "Kitchen",
      "Air conditioning",
      "Washer",
      "Balcony",
      "Elevator access",
      "Free parking",
    ],
    placeholderIcon: "star" as const,
    cancellationPolicy: "MODERATE" as const,
  },
];

export type SeedDemoDataSummary = {
  hostEmail: string;
  guestEmail: string;
  listingsCreated: number;
  listingsSkippedExisting: number;
  reviewsCreated: number;
  extrasProvidersUpserted: number;
};

export async function seedDemoData(prisma: PrismaClient): Promise<SeedDemoDataSummary> {
  const hostPassword = await bcrypt.hash("hostpass123", 10);
  const guestPassword = await bcrypt.hash("guestpass123", 10);

  const host = await prisma.user.upsert({
    where: { email: "host@fystay.dev" },
    update: {},
    create: {
      name: "Alex Host",
      email: "host@fystay.dev",
      passwordHash: hostPassword,
      role: "HOST",
      referralCode: generateReferralCode(),
    },
  });

  const guest = await prisma.user.upsert({
    where: { email: "guest@fystay.dev" },
    update: {},
    create: {
      name: "Jamie Guest",
      email: "guest@fystay.dev",
      passwordHash: guestPassword,
      role: "GUEST",
      referralCode: generateReferralCode(),
    },
  });

  const createdListings = [];
  const newlyCreatedTitles = new Set<string>();
  let listingsCreated = 0;
  let listingsSkippedExisting = 0;

  for (const { placeholderIcon, ...listing } of DEMO_LISTINGS) {
    const existing = await prisma.listing.findFirst({ where: { title: listing.title } });
    if (existing) {
      createdListings.push(existing);
      listingsSkippedExisting++;
      continue;
    }

    const created = await prisma.listing.create({
      data: {
        ...listing,
        photos: placeholderPhotos(listing.city, 4, placeholderIcon),
        hostId: host.id,
      },
    });
    const coordinates = geocodeListing({ id: created.id, city: created.city });
    const withCoordinates = coordinates
      ? await prisma.listing.update({ where: { id: created.id }, data: coordinates })
      : created;
    createdListings.push(withCoordinates);
    newlyCreatedTitles.add(listing.title);
    listingsCreated++;
  }

  // A completed stay + review for each of these listings, so the reviews
  // feature has something to show without needing a real guest to
  // complete a real stay first - covers the original everyday listing
  // plus all three premium ones, so "premium" also means "proven" rather
  // than showing no rating at all everywhere ratings are surfaced (search
  // sort, the homepage carousels, each listing's own detail page). Only
  // added for a listing this call actually created - otherwise a second
  // run of this same seed would keep stacking duplicate reviews onto
  // listings that already have one.
  const REVIEW_SEEDS = [
    {
      title: "Seafront apartment overlooking Blackpool promenade",
      checkInDaysAgo: 20,
      nights: 3,
      guests: 2,
      valueRating: 4,
      comment:
        "Wonderful stay right by the seafront. Spotless, comfortable, and the host was brilliant. Would book again in a heartbeat.",
    },
    {
      title: "Premium sea-view penthouse on Blackpool promenade",
      checkInDaysAgo: 12,
      nights: 3,
      guests: 4,
      valueRating: 5,
      comment:
        "Genuinely the best stay we've had on the Fylde Coast - the hot tub terrace at sunset looking over the sea was unreal, and everything felt hotel-grade. Worth every penny.",
    },
    {
      title: "Signature villa with private pool near Lytham St Annes",
      checkInDaysAgo: 8,
      nights: 4,
      guests: 6,
      valueRating: 5,
      comment:
        "Booked this for a big family week and it completely delivered - the pool and hot tub got used every single day, and the kitchen is better equipped than most restaurants. Faultless.",
    },
    {
      title: "Designer duplex overlooking Fleetwood Marina",
      checkInDaysAgo: 15,
      nights: 2,
      guests: 4,
      valueRating: 5,
      comment:
        "Stunning finish throughout and that marina view over the hot tub at dusk was worth the whole trip on its own. Felt like a boutique hotel, not a rental.",
    },
  ] as const;

  let reviewsCreated = 0;
  for (const seed of REVIEW_SEEDS) {
    const reviewedListing = createdListings.find((l) => l.title === seed.title);
    if (!reviewedListing || !newlyCreatedTitles.has(reviewedListing.title)) continue;

    const checkIn = new Date(Date.now() - seed.checkInDaysAgo * 24 * 60 * 60 * 1000);
    const checkOut = new Date(checkIn.getTime() + seed.nights * 24 * 60 * 60 * 1000);
    const pricing = computeBookingPricing({
      nights: seed.nights,
      pricePerNightCents: reviewedListing.pricePerNightCents,
      cleaningFeeCents: reviewedListing.cleaningFeeCents,
    });
    const booking = await prisma.booking.create({
      data: {
        reference: generateBookingReference(),
        listingId: reviewedListing.id,
        guestId: guest.id,
        checkIn,
        checkOut,
        guests: seed.guests,
        nights: seed.nights,
        nightlyPriceCents: reviewedListing.pricePerNightCents,
        cleaningFeeCents: pricing.cleaningFeeCents,
        serviceFeeCents: pricing.serviceFeeCents,
        taxCents: pricing.taxCents,
        totalPriceCents: pricing.totalPriceCents,
        status: "COMPLETED",
        paymentStatus: "PAID",
        paidAt: checkIn,
        guestName: guest.name,
        guestEmail: guest.email,
      },
    });
    await prisma.review.create({
      data: {
        bookingId: booking.id,
        listingId: reviewedListing.id,
        authorId: guest.id,
        rating: 5,
        cleanlinessRating: 5,
        accuracyRating: 5,
        communicationRating: 5,
        locationRating: 5,
        valueRating: seed.valueRating,
        comment: seed.comment,
      },
    });
    reviewsCreated++;
  }

  // Trip extras (see docs/trip-extras-roadmap.md): EV Exec is FYStay's own
  // transfer business and the first extras provider. The notification
  // email is read from an env var (with a placeholder fallback) rather
  // than hardcoded, since a real deployment needs booking requests
  // actually landing in EV Exec's real inbox, not a seeded placeholder.
  const evExec = await prisma.extraProvider.upsert({
    where: { name: "EV Exec" },
    update: {},
    create: {
      name: "EV Exec",
      category: "AIRPORT_TRANSFER",
      notificationEmail: process.env.EV_EXEC_NOTIFICATION_EMAIL ?? "bookings@evexec.example",
      bookingFormUrl: process.env.EV_EXEC_BOOKING_FORM_URL ?? null,
    },
  });
  await prisma.extraOffering.upsert({
    where: { providerId_name: { providerId: evExec.id, name: "Return airport transfer" } },
    update: {},
    create: {
      providerId: evExec.id,
      name: "Return airport transfer",
      description:
        "Door-to-door executive transfer between the airport and your stay, both ways - booked and confirmed by EV Exec.",
      category: "AIRPORT_TRANSFER",
      priceCents: 4500,
    },
  });

  // Phase 2 of the roadmap (docs/trip-extras-roadmap.md) - broadening past
  // EV Exec into the other categories the user named (attraction tickets,
  // car hire). Deliberately seeded under generic placeholder business
  // names rather than a real named local company - FYStay has no
  // confirmed commercial partnership or booking arrangement with any real
  // attraction/car-hire company yet, and seeding one under a real
  // company's name would misrepresent an affiliation that doesn't exist.
  // Once a real partner is signed, rename/replace these via /admin/extras
  // rather than this seed.
  const attractionsProvider = await prisma.extraProvider.upsert({
    where: { name: "Fylde Coast Attractions (placeholder)" },
    update: {},
    create: {
      name: "Fylde Coast Attractions (placeholder)",
      category: "ATTRACTION_TICKET",
      notificationEmail: "placeholder-attractions@fystay.invalid",
    },
  });
  await prisma.extraOffering.upsert({
    where: {
      providerId_name: {
        providerId: attractionsProvider.id,
        name: "Blackpool day attraction pass",
      },
    },
    update: {},
    create: {
      providerId: attractionsProvider.id,
      name: "Blackpool day attraction pass",
      description: "One day's entry to a local Blackpool-area attraction - confirmed after booking.",
      category: "ATTRACTION_TICKET",
      priceCents: 3500,
    },
  });

  const carHireProvider = await prisma.extraProvider.upsert({
    where: { name: "Fylde Coast Car Hire (placeholder)" },
    update: {},
    create: {
      name: "Fylde Coast Car Hire (placeholder)",
      category: "CAR_HIRE",
      notificationEmail: "placeholder-carhire@fystay.invalid",
    },
  });
  await prisma.extraOffering.upsert({
    where: { providerId_name: { providerId: carHireProvider.id, name: "3-day car hire" } },
    update: {},
    create: {
      providerId: carHireProvider.id,
      name: "3-day car hire",
      description: "A compact hire car for the length of your stay, collected locally.",
      category: "CAR_HIRE",
      priceCents: 9000,
    },
  });

  return {
    hostEmail: host.email,
    guestEmail: guest.email,
    listingsCreated,
    listingsSkippedExisting,
    reviewsCreated,
    extrasProvidersUpserted: 3,
  };
}

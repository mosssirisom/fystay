import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Seed listings ship with generated placeholder art instead of hotlinked
// stock photos: it renders instantly with zero external requests, so the
// demo never depends on a third-party image host being reachable.
const PALETTES: [string, string][] = [
  ["#0d9488", "#134e4a"],
  ["#f59e0b", "#b45309"],
  ["#0ea5e9", "#0369a1"],
  ["#f43f5e", "#9f1239"],
  ["#8b5cf6", "#5b21b6"],
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
type PlaceholderIcon = "house" | "mountain" | "waves";

const ICON_PATHS: Record<PlaceholderIcon, string[]> = {
  house: [
    "M3 11.5L12 4l9 7.5",
    "M5.5 10v9a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1v-9",
  ],
  mountain: ["M2 20 L8 8 L11 13 L15 5 L22 20 Z"],
  waves: [
    "M2 9c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0",
    "M2 15c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0",
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

const LISTINGS = [
  {
    title: "Sunlit loft in the heart of Chiang Mai",
    description:
      "A bright, airy loft two minutes from the Old City moat. Wake up to mountain views, work from the rooftop co-working nook, and walk to night markets after dark.",
    city: "Chiang Mai",
    country: "Thailand",
    pricePerNightCents: 4200,
    maxGuests: 3,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    amenities: ["Wifi", "Kitchen", "Air conditioning", "Workspace"],
    placeholderIcon: "house" as const,
  },
  {
    title: "Cliffside villa overlooking Ao Nang beach",
    description:
      "Private infinity pool, floor-to-ceiling glass walls, and a five-minute walk down to the beach. Perfect for groups chasing sunsets.",
    city: "Krabi",
    country: "Thailand",
    pricePerNightCents: 18500,
    maxGuests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    amenities: ["Pool", "Wifi", "Kitchen", "Free parking", "Ocean view"],
    placeholderIcon: "mountain" as const,
  },
  {
    title: "Modern canal-side apartment",
    description:
      "A design-forward apartment on a quiet canal, ten minutes by bike to the city center. Full kitchen, fast wifi, and a private balcony for morning coffee.",
    city: "Amsterdam",
    country: "Netherlands",
    pricePerNightCents: 15900,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    amenities: ["Wifi", "Kitchen", "Washer", "Bikes included"],
    placeholderIcon: "waves" as const,
  },
];

async function main() {
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
    },
  });

  for (const { placeholderIcon, ...listing } of LISTINGS) {
    await prisma.listing.create({
      data: {
        ...listing,
        photos: placeholderPhotos(listing.city, 4, placeholderIcon),
        hostId: host.id,
      },
    });
  }

  console.log("Seeded database:");
  console.log(`  host  -> ${host.email} / hostpass123`);
  console.log(`  guest -> ${guest.email} / guestpass123`);
  console.log(`  ${LISTINGS.length} listings created`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

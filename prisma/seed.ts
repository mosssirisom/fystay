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

function placeholderPhoto(seedText: string, index: number): string {
  const [from, to] = PALETTES[(hashCode(seedText) + index) % PALETTES.length];
  const angle = index % 2 === 0 ? "x1='0' y1='0' x2='1' y2='1'" : "x1='1' y1='0' x2='0' y2='1'";
  const letter = seedText.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
    <defs><linearGradient id="g" ${angle}>
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="54%" font-family="Arial, sans-serif" font-size="240" font-weight="700" fill="rgba(255,255,255,0.22)" text-anchor="middle" dominant-baseline="middle">${letter}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function placeholderPhotos(seedText: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => placeholderPhoto(seedText, i));
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

  for (const listing of LISTINGS) {
    await prisma.listing.create({
      data: {
        ...listing,
        photos: placeholderPhotos(listing.city, 4),
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

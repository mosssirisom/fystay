import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PHOTO_SETS = [
  [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
  ],
  [
    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200",
    "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1200",
  ],
  [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200",
    "https://images.unsplash.com/photo-1560449017-7b3b3aad9a2f?w=1200",
  ],
];

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

  for (const [index, listing] of LISTINGS.entries()) {
    await prisma.listing.create({
      data: {
        ...listing,
        photos: PHOTO_SETS[index % PHOTO_SETS.length],
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

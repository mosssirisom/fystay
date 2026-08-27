import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BedDouble, Bath, DoorOpen, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { BookingWidget } from "@/components/BookingWidget";
import { PhotoGallery } from "@/components/PhotoGallery";
import { AmenityList } from "@/components/AmenityList";
import { Avatar } from "@/components/ui/Avatar";

const getListing = cache(async (id: string) => {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      host: { select: { name: true } },
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        select: { checkIn: true, checkOut: true },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing || !listing.published) return {};

  const description = `${listing.title} in ${listing.city}, ${listing.country}. ${listing.description.slice(0, 140)}`;

  return {
    title: listing.title,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: listing.photos[0] ? [{ url: listing.photos[0] }] : undefined,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, session] = await Promise.all([getListing(id), auth()]);

  if (!listing || !listing.published) {
    notFound();
  }

  const stats = [
    { icon: Users, label: `${listing.maxGuests} guest${listing.maxGuests > 1 ? "s" : ""}` },
    { icon: DoorOpen, label: `${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"}` },
    { icon: BedDouble, label: `${listing.beds} bed${listing.beds === 1 ? "" : "s"}` },
    { icon: Bath, label: `${listing.bathrooms} bath${listing.bathrooms === 1 ? "" : "s"}` },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
      <p className="mt-1 text-zinc-600">
        {listing.city}, {listing.country}
      </p>

      <PhotoGallery photos={listing.photos} title={listing.title} />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between gap-4 border-b border-border-subtle pb-6">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {stats.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 text-zinc-700">
                  <Icon className="h-4.5 w-4.5 text-zinc-500" />
                  {label}
                </span>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Avatar name={listing.host.name} />
              <div className="hidden text-sm sm:block">
                <p className="font-medium text-foreground">{listing.host.name}</p>
                <p className="text-zinc-500">Host</p>
              </div>
            </div>
          </div>

          <p className="mt-6 whitespace-pre-line text-zinc-700">{listing.description}</p>

          {listing.amenities.length > 0 && (
            <>
              <hr className="my-6 border-border-subtle" />
              <h2 className="text-lg font-semibold text-foreground">What this place offers</h2>
              <AmenityList amenities={listing.amenities} />
            </>
          )}
        </div>

        <div>
          <BookingWidget
            listingId={listing.id}
            pricePerNightCents={listing.pricePerNightCents}
            maxGuests={listing.maxGuests}
            bookedRanges={listing.bookings.map((b) => ({
              checkIn: b.checkIn.toISOString(),
              checkOut: b.checkOut.toISOString(),
            }))}
            isLoggedIn={Boolean(session?.user)}
          />
        </div>
      </div>
    </div>
  );
}

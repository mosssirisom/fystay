import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { BookingWidget } from "@/components/BookingWidget";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, session] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      include: {
        host: { select: { name: true } },
        bookings: {
          where: { status: { in: ["PENDING", "CONFIRMED"] } },
          select: { checkIn: true, checkOut: true },
        },
      },
    }),
    auth(),
  ]);

  if (!listing || !listing.published) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold">{listing.title}</h1>
      <p className="mt-1 text-zinc-600">
        {listing.city}, {listing.country} · Hosted by {listing.host.name}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 overflow-hidden rounded-2xl sm:grid-cols-4">
        {listing.photos.slice(0, 4).map((photo, i) => (
          <div
            key={photo}
            className={`relative aspect-square bg-zinc-100 ${i === 0 ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2" : ""}`}
          >
            <Image
              src={photo}
              alt={`${listing.title} photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="50vw"
              unoptimized
            />
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="font-medium text-zinc-800">
            {listing.maxGuests} guests · {listing.bedrooms} bedrooms · {listing.beds} beds ·{" "}
            {listing.bathrooms} baths
          </p>

          <hr className="my-6 border-zinc-200" />

          <p className="whitespace-pre-line text-zinc-700">{listing.description}</p>

          {listing.amenities.length > 0 && (
            <>
              <hr className="my-6 border-zinc-200" />
              <h2 className="text-lg font-semibold">What this place offers</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-zinc-700">
                {listing.amenities.map((amenity) => (
                  <li key={amenity}>{amenity}</li>
                ))}
              </ul>
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

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "@/components/ListingForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: listing ? `Edit ${listing.title}` : "Edit listing",
    robots: { index: false },
  };
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/host/listings/${id}/edit`);

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) notFound();
  if (listing.hostId !== session.user.id) redirect("/host/dashboard");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit listing</h1>
      <ListingForm
        listingId={listing.id}
        initialValues={{
          title: listing.title,
          description: listing.description,
          city: listing.city,
          country: listing.country,
          address: listing.address ?? "",
          pricePerNight: (listing.pricePerNightCents / 100).toString(),
          cleaningFee: listing.cleaningFeeCents > 0 ? (listing.cleaningFeeCents / 100).toString() : "",
          maxGuests: listing.maxGuests.toString(),
          bedrooms: listing.bedrooms.toString(),
          beds: listing.beds.toString(),
          bathrooms: listing.bathrooms.toString(),
          photos: listing.photos,
          amenities: listing.amenities.join(", "),
        }}
      />
    </div>
  );
}

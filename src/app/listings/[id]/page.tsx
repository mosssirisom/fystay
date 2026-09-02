import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BedDouble, Bath, DoorOpen, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { blockingBookingWhere, blockingRanges } from "@/lib/availability";
import { auth } from "@/auth";
import { BookingWidget } from "@/components/BookingWidget";
import { MobileBookingBar } from "@/components/MobileBookingBar";
import { PhotoGallery } from "@/components/PhotoGallery";
import { AmenityList } from "@/components/AmenityList";
import { ReviewSummary } from "@/components/ReviewSummary";
import { ReviewList } from "@/components/ReviewList";
import { SaveButton } from "@/components/SaveButton";
import { Avatar } from "@/components/ui/Avatar";
import { SITE_NAME, SITE_URL, withCity } from "@/lib/seo";

const getListing = cache(async (id: string) => {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      host: { select: { name: true } },
      bookings: {
        where: blockingBookingWhere(),
        select: { checkIn: true, checkOut: true },
      },
      availabilityBlocks: {
        select: { startDate: true, endDate: true },
      },
      reviews: {
        where: { status: "PUBLISHED" },
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
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

  const title = withCity(listing.title, listing.city);
  const description = `${listing.title} in ${listing.city}, ${listing.country}. ${listing.description.slice(0, 140)}`;
  const url = `${SITE_URL}/listings/${listing.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: listing.photos[0] ? [{ url: listing.photos[0] }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: listing.photos[0] ? [listing.photos[0]] : undefined,
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

  const isSaved = session?.user
    ? Boolean(
        await prisma.savedListing.findUnique({
          where: { userId_listingId: { userId: session.user.id, listingId: listing.id } },
        }),
      )
    : false;

  const reportedReviewIds = session?.user
    ? new Set(
        (
          await prisma.reviewReport.findMany({
            where: {
              reporterId: session.user.id,
              reviewId: { in: listing.reviews.map((r) => r.id) },
            },
            select: { reviewId: true },
          })
        ).map((r) => r.reviewId),
      )
    : new Set<string>();

  const stats = [
    { icon: Users, label: `${listing.maxGuests} guest${listing.maxGuests > 1 ? "s" : ""}` },
    { icon: DoorOpen, label: `${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"}` },
    { icon: BedDouble, label: `${listing.beds} bed${listing.beds === 1 ? "" : "s"}` },
    { icon: Bath, label: `${listing.bathrooms} bath${listing.bathrooms === 1 ? "" : "s"}` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.photos,
    url: `${SITE_URL}/listings/${listing.id}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city,
      addressCountry: listing.country,
    },
    offers: {
      "@type": "Offer",
      price: (listing.pricePerNightCents / 100).toFixed(2),
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/listings/${listing.id}`,
    },
    ...(listing.reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (
              listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length
            ).toFixed(1),
            reviewCount: listing.reviews.length,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 pb-24 lg:pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
          <p className="mt-1 text-zinc-600">
            {listing.city}, {listing.country}
          </p>
        </div>
        <SaveButton
          listingId={listing.id}
          initialSaved={isSaved}
          isLoggedIn={Boolean(session?.user)}
          className="static shrink-0 border border-border-subtle bg-surface"
        />
      </div>

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

          {listing.reviews.length > 0 && (
            <>
              <hr className="my-6 border-border-subtle" />
              <h2 className="text-lg font-semibold text-foreground">Reviews</h2>
              <div className="mt-4">
                <ReviewSummary reviews={listing.reviews} />
              </div>
              <ReviewList
                reviews={listing.reviews}
                hostName={listing.host.name}
                viewerId={session?.user?.id}
                reportedReviewIds={reportedReviewIds}
              />
            </>
          )}
        </div>

        <div id="booking-widget">
          <BookingWidget
            listingId={listing.id}
            pricePerNightCents={listing.pricePerNightCents}
            cleaningFeeCents={listing.cleaningFeeCents}
            maxGuests={listing.maxGuests}
            amenities={listing.amenities}
            bookedRanges={blockingRanges(listing.bookings, listing.availabilityBlocks).map(
              (r) => ({ checkIn: r.checkIn.toISOString(), checkOut: r.checkOut.toISOString() }),
            )}
            isLoggedIn={Boolean(session?.user)}
          />
        </div>
      </div>

      <MobileBookingBar pricePerNightCents={listing.pricePerNightCents} />
    </div>
  );
}

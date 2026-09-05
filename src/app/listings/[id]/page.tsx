import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BedDouble, Bath, DoorOpen, MapPin, Star, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { blockingBookingWhere, blockingRanges } from "@/lib/availability";
import { resolveCancellationPolicy } from "@/lib/cancellationPolicy";
import { auth } from "@/auth";
import { BookingWidget } from "@/components/BookingWidget";
import { MobileBookingBar } from "@/components/MobileBookingBar";
import { PhotoGallery } from "@/components/PhotoGallery";
import { AmenityList } from "@/components/AmenityList";
import { NearbyAttractions } from "@/components/NearbyAttractions";
import { ReviewSummary } from "@/components/ReviewSummary";
import { ReviewList } from "@/components/ReviewList";
import { Avatar } from "@/components/ui/Avatar";
import { SITE_NAME, SITE_URL, withCity } from "@/lib/seo";
import { averageRating } from "@/lib/reviews";

const getListing = cache(async (id: string) => {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      host: { select: { name: true, createdAt: true } },
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

  const [isSaved, hostReviewCount] = await Promise.all([
    session?.user
      ? prisma.savedListing
          .findUnique({
            where: { userId_listingId: { userId: session.user.id, listingId: listing.id } },
          })
          .then(Boolean)
      : Promise.resolve(false),
    // Across every listing this host runs, not just this one - a host with
    // one glowing review on their tenth property and a host with their
    // first-ever review look identical from a single listing's own count.
    prisma.review.count({
      where: { status: "PUBLISHED", listing: { hostId: listing.hostId } },
    }),
  ]);

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

  const rating = averageRating(listing.reviews);
  const reviewCount = listing.reviews.length;
  const cancellationPolicy = resolveCancellationPolicy(listing);

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
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{listing.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            {listing.city}, {listing.country}
          </span>
          {rating !== null && (
            <>
              <span aria-hidden className="text-zinc-300">
                ·
              </span>
              {/* Jumps straight to the full review breakdown below, rather
                  than repeating it here as inert text. */}
              <a href="#reviews" className="flex items-center gap-1 font-medium text-foreground hover:underline">
                <Star className="h-4 w-4 fill-accent-500 text-accent-500" aria-hidden />
                {rating.toFixed(1)}
                <span className="font-normal text-zinc-500">
                  ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                </span>
              </a>
            </>
          )}
        </div>
      </div>

      <PhotoGallery
        photos={listing.photos}
        title={listing.title}
        listingId={listing.id}
        isSaved={isSaved}
        isLoggedIn={Boolean(session?.user)}
      />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {stats.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 text-zinc-700">
                  <Icon className="h-4.5 w-4.5 text-brand-600" />
                  {label}
                </span>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Avatar name={listing.host.name} />
              <div className="hidden text-sm sm:block">
                <p className="text-zinc-500">Hosted by</p>
                <p className="font-medium text-foreground">{listing.host.name}</p>
                {/* Join date and review count are the two things this app
                    can actually vouch for about a host - real columns on
                    real rows, not a response-rate or "verified ID" claim
                    this codebase has no data behind. */}
                <p className="mt-0.5 text-xs text-zinc-500">
                  Hosting since {listing.host.createdAt.getFullYear()}
                  {hostReviewCount > 0 &&
                    ` · ${hostReviewCount} review${hostReviewCount === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>
          </div>

          <h2 className="mt-6 text-lg font-semibold text-foreground">About this place</h2>
          <p className="mt-2 whitespace-pre-line text-zinc-700">{listing.description}</p>

          {listing.amenities.length > 0 && (
            <>
              <hr className="my-6 border-border-subtle" />
              <h2 className="text-lg font-semibold text-foreground">What this place offers</h2>
              <AmenityList amenities={listing.amenities} />
            </>
          )}

          <NearbyAttractions latitude={listing.latitude} longitude={listing.longitude} />

          <hr className="my-6 border-border-subtle" />
          <h2 id="cancellation-policy" className="scroll-mt-20 text-lg font-semibold text-foreground">
            Cancellation policy
          </h2>
          <p className="mt-2 text-zinc-700">
            <span className="font-medium text-foreground">{cancellationPolicy.label}.</span>{" "}
            {cancellationPolicy.description}
          </p>

          {listing.reviews.length > 0 && (
            <>
              <hr className="my-6 border-border-subtle" />
              <h2 id="reviews" className="scroll-mt-20 text-lg font-semibold text-foreground">
                Reviews
              </h2>
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
            rating={rating}
            reviewCount={reviewCount}
            cancellationPolicyLabel={cancellationPolicy.label}
          />
        </div>
      </div>

      <MobileBookingBar pricePerNightCents={listing.pricePerNightCents} />
    </div>
  );
}

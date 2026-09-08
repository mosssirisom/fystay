import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BedDouble,
  Bath,
  BookOpen,
  DoorOpen,
  Home,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { blockingBookingWhere, blockingRanges } from "@/lib/availability";
import { resolveCancellationPolicy } from "@/lib/cancellationPolicy";
import { auth } from "@/auth";
import { BookingWidget } from "@/components/BookingWidget";
import { MobileBookingBar } from "@/components/MobileBookingBar";
import { PhotoGallery } from "@/components/PhotoGallery";
import { AmenityList } from "@/components/AmenityList";
import { NearbyAttractions } from "@/components/NearbyAttractions";
import { ContactHostButton } from "@/components/ContactHostButton";
import { ReviewSummary } from "@/components/ReviewSummary";
import { ReviewList } from "@/components/ReviewList";
import { SectionHeading } from "@/components/SectionHeading";
import { Avatar } from "@/components/ui/Avatar";
import { FYLDE_COAST_DESTINATIONS } from "@/lib/destinations";
import { LOCAL_GUIDES } from "@/lib/localGuide";
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

  // Home > city > this listing - lets a search result show the listing's
  // place in the site instead of a bare URL, and gives an AI crawler the
  // same "where does this page sit" signal a human gets from a breadcrumb
  // trail. The city link points at that town's own indexable
  // /destinations page when one exists, rather than the noindexed
  // /search?city= results view - a breadcrumb is only useful to a crawler
  // if it can actually follow it somewhere worth ranking.
  const cityDestination = FYLDE_COAST_DESTINATIONS.find(
    (destination) => destination.searchCity.toLowerCase() === listing.city.toLowerCase(),
  );
  const cityUrl = cityDestination
    ? `${SITE_URL}/destinations/${cityDestination.slug}`
    : `${SITE_URL}/search?city=${encodeURIComponent(listing.city)}`;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: listing.city, item: cityUrl },
      {
        "@type": "ListItem",
        position: 3,
        name: listing.title,
        item: `${SITE_URL}/listings/${listing.id}`,
      },
    ],
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
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
              <Avatar name={listing.host.name} size={48} className="ring-2 ring-brand-50" />
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

          {session?.user?.id !== listing.hostId && (
            <div className="mt-4">
              <ContactHostButton
                listingId={listing.id}
                hostName={listing.host.name}
                isLoggedIn={Boolean(session?.user)}
              />
            </div>
          )}

          <div className="mt-8">
            <SectionHeading icon={Home}>About this place</SectionHeading>
            <p className="mt-3 whitespace-pre-line text-zinc-700">{listing.description}</p>
          </div>

          {listing.amenities.length > 0 && (
            <div className="mt-10">
              <SectionHeading icon={Sparkles}>What this place offers</SectionHeading>
              <AmenityList amenities={listing.amenities} />
            </div>
          )}

          <NearbyAttractions latitude={listing.latitude} longitude={listing.longitude} />

          {cityDestination && LOCAL_GUIDES[cityDestination.slug] && (
            <Link
              href={`/destinations/${cityDestination.slug}#local-guide`}
              className="focus-ring mt-10 flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                Read the full {listing.city} Local Guide - things to do, eat and explore nearby
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          )}

          <div className="mt-10">
            <SectionHeading icon={ShieldCheck} id="cancellation-policy">
              Cancellation policy
            </SectionHeading>
            <p className="mt-3 text-zinc-700">
              <span className="font-medium text-foreground">{cancellationPolicy.label}.</span>{" "}
              {cancellationPolicy.description}
            </p>
          </div>

          {listing.reviews.length > 0 && (
            <div className="mt-10">
              <SectionHeading icon={Star} id="reviews">
                Reviews
              </SectionHeading>
              <div className="mt-4">
                <ReviewSummary reviews={listing.reviews} />
              </div>
              <ReviewList
                reviews={listing.reviews}
                hostName={listing.host.name}
                viewerId={session?.user?.id}
                reportedReviewIds={reportedReviewIds}
              />
            </div>
          )}
        </div>

        <div id="booking-widget">
          <BookingWidget
            listingId={listing.id}
            pricePerNightCents={listing.pricePerNightCents}
            cleaningFeeCents={listing.cleaningFeeCents}
            weeklyDiscountPercent={listing.weeklyDiscountPercent}
            monthlyDiscountPercent={listing.monthlyDiscountPercent}
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

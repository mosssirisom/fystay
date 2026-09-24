import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, ExternalLink, MapPin, Star } from "lucide-react";
import {
  destinationSlugFor,
  getHotelAvailability,
  getHotelForBooking,
} from "@/lib/hotelProviders/search";
import { getHotelProviderAdapter } from "@/lib/hotelProviders/registry";
import { parseOptionalGuestCounts, parseOptionalStayWindow } from "@/lib/hotelSearchParams";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatProviderPrice } from "@/lib/format";
import { SITE_URL, withCity } from "@/lib/seo";

type Params = { destination: string; hotelSlug: string };
type SearchParams = Record<string, string | string[] | undefined>;

const getHotel = cache(async (slug: string) => getHotelForBooking(slug));

/**
 * A guest can land here straight from a search result (real dates/guests
 * carried in the URL - see HotelResultCard) or from a bookmarked/shared
 * link with no query string at all. The latter still needs *some* stay to
 * show live availability for, so this picks a week out, one night - a
 * plain, always-in-the-future default, not an error state (unlike the
 * search page, where missing dates on a real search attempt is invalid
 * input worth telling the guest about).
 */
function defaultStayWindow(): { checkIn: Date; checkOut: Date } {
  const checkIn = new Date();
  checkIn.setHours(0, 0, 0, 0);
  checkIn.setDate(checkIn.getDate() + 7);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 1);
  return { checkIn, checkOut };
}

function formatDateRange(checkIn: Date, checkOut: Date): string {
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
  return `${fmt.format(checkIn)} – ${fmt.format(checkOut)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { hotelSlug } = await params;
  const outcome = await getHotel(hotelSlug);
  if (outcome.status !== "ok") return {};

  const { details, slug } = outcome.hotel;
  const title = withCity(details.name, details.city);
  const url = `${SITE_URL}/hotels/${destinationSlugFor(details.city)}/${slug}`;

  return {
    title,
    description:
      details.description?.slice(0, 155) ??
      `${details.name} in ${details.city}, ${details.country} - compare and book via our booking partner.`,
    alternates: { canonical: url },
    // Built against the mock provider only today (Phase 5) - never index a
    // page whose content is test fixture data. Revisit once a real
    // provider (e.g. Booking.com) is live and this reflects real inventory.
    robots: { index: false, follow: true },
    openGraph: details.photos[0] ? { title, images: [{ url: details.photos[0] }] } : undefined,
  };
}

/**
 * The affiliate hotel detail page - photos/description/facilities/rating
 * come from a live getHotelForBooking() call (never the AffiliateHotel
 * cache row directly - see search.ts's own top comment on why), and every
 * "Book now" CTA links straight out to the provider via a deep link built
 * server-side from data this app already holds, opening in a new tab so a
 * guest never loses their place on FYStay. FYStay never takes payment or a
 * booking on this page itself.
 */
export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { destination, hotelSlug } = await params;
  const resolvedSearchParams = await searchParams;

  const outcome = await getHotel(hotelSlug);
  if (outcome.status === "not_found") notFound();

  if (outcome.status === "unavailable") {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-stone-300" aria-hidden />
        <p className="font-medium text-foreground">This hotel isn&apos;t available right now</p>
        <p className="max-w-sm text-sm text-stone-500">{outcome.message}</p>
      </div>
    );
  }

  const { hotel } = outcome;
  const canonicalDestination = destinationSlugFor(hotel.details.city);
  if (destination !== canonicalDestination) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (typeof value === "string") query.set(key, value);
    }
    const qs = query.toString();
    redirect(`/hotels/${canonicalDestination}/${hotel.slug}${qs ? `?${qs}` : ""}`);
  }

  const stayWindow = parseOptionalStayWindow(resolvedSearchParams) ?? defaultStayWindow();
  const guestCounts = parseOptionalGuestCounts(resolvedSearchParams) ?? {
    adults: 2,
    children: 0,
    rooms: 1,
  };

  const availabilityOutcome = await getHotelAvailability(hotel.providerCode, hotel.externalId, {
    ...stayWindow,
    ...guestCounts,
  });

  const adapter = getHotelProviderAdapter(hotel.providerCode);
  const details = hotel.details;
  const totalGuests = guestCounts.adults + guestCounts.children;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-stone-500">
        <Link href="/hotels" className="focus-ring rounded-sm hover:text-brand-700">
          Hotels
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-stone-600">{details.name}</span>
      </nav>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{details.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
            {details.city}, {details.country}
          </span>
          {details.starRating != null && <span>{details.starRating}-star hotel</span>}
          {details.guestRating != null && (
            <span className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-xs font-medium text-stone-700">
              <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" aria-hidden />
              {details.guestRating.toFixed(1)}
              {details.reviewCount ? <span className="text-stone-500">({details.reviewCount})</span> : null}
            </span>
          )}
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-stone-600">
            Via {hotel.providerName}
          </span>
        </div>
      </div>

      <PhotoGallery photos={details.photos} title={details.name} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-8">
          {details.description && (
            <section>
              <h2 className="text-lg font-semibold text-foreground">About this hotel</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{details.description}</p>
            </section>
          )}

          {details.facilities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground">Facilities</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {details.facilities.map((facility) => (
                  <li
                    key={facility}
                    className="rounded-full border border-border-subtle bg-surface-muted px-3 py-1 text-xs font-medium text-stone-600"
                  >
                    {facility}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside>
          <Card className="lg:sticky lg:top-24">
            <CardHeader className="pb-0">
              <CardTitle>Available deals</CardTitle>
              <p className="mt-1 text-xs text-stone-500">
                {formatDateRange(stayWindow.checkIn, stayWindow.checkOut)} · {totalGuests} guest
                {totalGuests === 1 ? "" : "s"}, {guestCounts.rooms} room{guestCounts.rooms === 1 ? "" : "s"}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4">
              {availabilityOutcome.status === "unavailable" ? (
                <p className="text-sm text-stone-500">{availabilityOutcome.message}</p>
              ) : availabilityOutcome.deals.length === 0 ? (
                <p className="text-sm text-stone-500">
                  No rooms available for these dates. Try different dates.
                </p>
              ) : (
                availabilityOutcome.deals.map((deal, i) => {
                  const deepLink = adapter.createDeepLink({
                    externalId: hotel.externalId,
                    checkIn: stayWindow.checkIn,
                    checkOut: stayWindow.checkOut,
                    adults: guestCounts.adults,
                    children: guestCounts.children,
                    rooms: guestCounts.rooms,
                    subId: crypto.randomUUID(),
                  });
                  return (
                    <div key={deal.externalRoomId ?? i} className="rounded-xl border border-border-subtle p-3">
                      <p className="text-sm font-semibold text-foreground">{deal.name}</p>
                      {deal.description && (
                        <p className="mt-0.5 text-xs text-stone-500">{deal.description}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-serif text-lg tabular-nums text-brand-800">
                          {formatProviderPrice(deal.priceCents, deal.currency)}
                        </span>
                        {deal.refundable != null && (
                          <span className="text-xs text-stone-500">
                            {deal.refundable ? "Free cancellation" : "Non-refundable"}
                          </span>
                        )}
                      </div>
                      <a
                        href={deepLink}
                        target="_blank"
                        rel="nofollow sponsored noopener noreferrer"
                        className="focus-ring mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
                      >
                        Book now on {hotel.providerName}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    </div>
                  );
                })
              )}
              <p className="mt-1 text-[11px] text-stone-500">
                You&apos;ll book and pay directly with {hotel.providerName}. FYStay doesn&apos;t process this
                booking.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

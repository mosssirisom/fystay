import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { formatPrice } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function BookingSummaryCard({
  listing,
  checkIn,
  checkOut,
  nights,
  guests,
  nightlyPriceCents,
  cleaningFeeCents,
  serviceFeeCents,
  taxCents,
  totalPriceCents,
  reference,
}: {
  listing: { title: string; city: string; country: string; photos: string[] };
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  nightlyPriceCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  taxCents: number;
  totalPriceCents: number;
  reference?: string;
}) {
  const nightlySubtotalCents = nights * nightlyPriceCents;

  return (
    <Card className="p-5">
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex gap-4">
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
            {listing.photos[0] ? (
              <Image
                src={listing.photos[0]}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="112px"
                unoptimized={!isOptimizableImage(listing.photos[0])}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                <ImageOff className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{listing.title}</p>
            <p className="text-sm text-zinc-500">
              {listing.city}, {listing.country}
            </p>
            {reference && (
              <p className="mt-1 text-xs font-medium text-zinc-500">Booking #{reference}</p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-y-1.5 border-t border-border-subtle pt-4 text-sm">
          <dt className="text-zinc-500">Check-in</dt>
          <dd className="text-right text-foreground">{dateFormatter.format(checkIn)}</dd>
          <dt className="text-zinc-500">Check-out</dt>
          <dd className="text-right text-foreground">{dateFormatter.format(checkOut)}</dd>
          <dt className="text-zinc-500">Length of stay</dt>
          <dd className="text-right text-foreground">
            {nights} night{nights === 1 ? "" : "s"}
          </dd>
          <dt className="text-zinc-500">Guests</dt>
          <dd className="text-right text-foreground">
            {guests} guest{guests === 1 ? "" : "s"}
          </dd>
        </dl>

        <div className="flex flex-col gap-2 border-t border-border-subtle pt-4 text-sm text-zinc-700">
          <div className="flex justify-between">
            <span>
              {formatPrice(nightlyPriceCents)} × {nights} night{nights === 1 ? "" : "s"}
            </span>
            <span>{formatPrice(nightlySubtotalCents)}</span>
          </div>
          {cleaningFeeCents > 0 && (
            <div className="flex justify-between">
              <span>Cleaning fee</span>
              <span>{formatPrice(cleaningFeeCents)}</span>
            </div>
          )}
          {serviceFeeCents > 0 && (
            <div className="flex justify-between">
              <span>Service fee</span>
              <span>{formatPrice(serviceFeeCents)}</span>
            </div>
          )}
          {taxCents > 0 && (
            <div className="flex justify-between">
              <span>Taxes</span>
              <span>{formatPrice(taxCents)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border-subtle pt-3 text-base font-semibold text-foreground">
            <span>Total (GBP)</span>
            <span>{formatPrice(totalPriceCents)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

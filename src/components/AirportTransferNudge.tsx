"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Plane } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { trackAddonEvent } from "@/lib/analytics";
import { useViewOnce } from "@/hooks/useViewOnce";

// Same reasoning as TripExtrasCard's own redirectTo: a plain module-level
// function sidesteps a React Compiler false positive about mutating
// window from inside this component's click handler.
function redirectTo(url: string) {
  window.location.href = url;
}

/**
 * The confirmation-page upsell (item 4 of the cross-sell brief in
 * docs/trip-extras-roadmap.md) - a prominent-but-premium card, not a
 * homepage banner and not the single quiet line this used to be: this is
 * the one moment in the journey where a guest who's just paid for their
 * stay is still on the page and "arriving by air?" is unambiguously
 * relevant. Still restrained per item 8 - a plain brand-tinted card, no
 * gradient, no second logo, EV Exec named once in the body copy rather
 * than the headline.
 */
export function AirportTransferNudge({
  bookingId,
  offeringId,
  providerName,
  priceCents,
  features,
}: {
  bookingId: string;
  offeringId: string;
  providerName: string;
  priceCents: number;
  features: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const viewRef = useViewOnce<HTMLDivElement>(() => {
    trackAddonEvent({
      name: "transfer_offer_viewed",
      category: "AIRPORT_TRANSFER",
      surface: "confirmation",
      offeringId,
      bookingId,
    });
  });

  async function addTransfer() {
    trackAddonEvent({
      name: "transfer_offer_clicked",
      category: "AIRPORT_TRANSFER",
      surface: "confirmation",
      offeringId,
      bookingId,
    });
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/extras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offeringId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not add this transfer. Please try again.");
        setLoading(false);
        return;
      }
      if (data.devMode) {
        toast.success("Transfer added to your trip.");
        router.refresh();
        return;
      }
      redirectTo(data.url);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      ref={viewRef}
      className="mt-6 w-full rounded-2xl border border-brand-100 bg-brand-50/60 p-5 text-left"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
          <Plane className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-foreground">
            Your stay is booked. Now complete your journey.
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Add a private {providerName} airport transfer and travel from the airport to your
            FYStay accommodation in comfort.
          </p>
        </div>
      </div>

      {features.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 pl-[52px]">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-1.5 text-xs text-stone-600">
              <Check className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-3 pl-[52px]">
        <Button onClick={addTransfer} loading={loading}>
          Add airport transfer
        </Button>
        <p className="text-xs text-stone-500">
          From <span className="font-semibold text-foreground">{formatPrice(priceCents)}</span>
        </p>
      </div>
    </div>
  );
}

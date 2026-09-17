"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";

// Same reasoning as TripExtrasCard's own redirectTo: a plain module-level
// function sidesteps a React Compiler false positive about mutating
// window from inside this component's click handler.
function redirectTo(url: string) {
  window.location.href = url;
}

/**
 * A single, quiet line on the booking confirmation page - not a homepage
 * banner. This is the one moment in the whole journey where "arriving by
 * air?" is genuinely relevant (a guest who's just paid for their stay,
 * still on the page), so it earns a mention here without needing to sell
 * itself anywhere else. Deliberately undersized next to the booking
 * summary above it: no gradient, no shadow, no second brand's name in the
 * headline - EV Exec is FYStay's own transfer arm, not a sponsor, and
 * reads that way (small print only), the same restraint TripExtrasCard
 * already applies to every other extra.
 */
export function AirportTransferNudge({
  bookingId,
  offeringId,
  providerName,
  priceCents,
}: {
  bookingId: string;
  offeringId: string;
  providerName: string;
  priceCents: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function addTransfer() {
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
    <div className="mt-4 flex w-full flex-col items-start gap-3 rounded-xl border border-border-subtle px-4 py-3.5 text-left sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <Plane className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground">Arriving by air?</p>
          <p className="text-sm text-stone-500">
            Complete your journey with a private electric transfer.
          </p>
          <p className="mt-1 text-xs text-stone-400">Operated by {providerName}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 self-stretch sm:self-auto">
        <p className="text-xs text-stone-500">
          From <span className="font-semibold text-foreground">{formatPrice(priceCents)}</span>
        </p>
        <Button variant="outline" size="sm" onClick={addTransfer} loading={loading}>
          Add transfer
        </Button>
      </div>
    </div>
  );
}

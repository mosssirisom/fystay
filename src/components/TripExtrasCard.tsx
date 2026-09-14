"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CarFront } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/format";

// Pulled out to a plain module-level function rather than assigning
// window.location.href inline: with this component's "buy" handler called
// from inside a .map() over offerings, the React Compiler's escape
// analysis flags a direct window mutation there as modifying something
// "defined outside a component" - wrapping it here sidesteps that false
// positive without changing the actual behavior (a full navigation to
// Stripe's hosted checkout).
function redirectTo(url: string) {
  window.location.href = url;
}

export type TripExtraOffering = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  providerName: string;
};

/**
 * The "Complete your trip" upsell (see docs/trip-extras-roadmap.md) - shown
 * on a guest's own confirmed booking, offering paid add-ons (airport
 * transfers first) alongside the stay itself. Only ever rendered by the
 * booking detail page once there's at least one active offering to show;
 * paidOfferingIds is precomputed server-side from that page's own
 * BookingExtra query, the same "compute on the server, render on the
 * client" split DepositStatusCard already uses.
 */
export function TripExtrasCard({
  bookingId,
  offerings,
  paidOfferingIds,
}: {
  bookingId: string;
  offerings: TripExtraOffering[];
  paidOfferingIds: string[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const paid = new Set(paidOfferingIds);

  async function buy(offeringId: string) {
    setLoadingId(offeringId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/extras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offeringId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not add this extra. Please try again.");
        setLoadingId(null);
        return;
      }
      if (data.devMode) {
        toast.success("Added to your trip.");
        setLoadingId(null);
        router.refresh();
        return;
      }
      redirectTo(data.url);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoadingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete your trip</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-stone-500">
          Door-to-door extras for this stay, booked and paid for in one place.
        </p>
        {offerings.map((offering) => {
          const alreadyPaid = paid.has(offering.id);
          return (
            <div
              key={offering.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-border-subtle p-4"
            >
              <div className="flex gap-3">
                <CarFront className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">{offering.name}</p>
                  {offering.description && (
                    <p className="mt-0.5 text-sm text-stone-500">{offering.description}</p>
                  )}
                  <p className="mt-1 text-xs text-stone-400">Provided by {offering.providerName}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <p className="font-semibold text-foreground">{formatPrice(offering.priceCents)}</p>
                {alreadyPaid ? (
                  <Badge variant="success">Added</Badge>
                ) : (
                  <Button size="sm" onClick={() => buy(offering.id)} loading={loadingId === offering.id}>
                    Add
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

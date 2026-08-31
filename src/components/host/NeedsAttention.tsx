"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ChangeRequestActions } from "@/components/ChangeRequestActions";
import { Card } from "@/components/ui/Card";

export type PendingChangeRequest = {
  id: string;
  bookingId: string;
  listingId: string;
  listingTitle: string;
  requestedCheckIn: Date;
  requestedCheckOut: Date;
  requestedGuests: number;
  priceDeltaCents: number;
};

/**
 * Every pending change request across every listing, in one place - the
 * host-side equivalent of a booking inbox, instead of making a host hunt
 * through each listing's own booking history to notice one needs a reply.
 */
export function NeedsAttention({ requests }: { requests: PendingChangeRequest[] }) {
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());
  const visible = requests.filter((r) => !handledIds.has(r.id));

  if (visible.length === 0) return null;

  function markHandled(id: string) {
    setHandledIds((prev) => new Set(prev).add(id));
  }
  function unmarkHandled(id: string) {
    setHandledIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div className="mt-8">
      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <BellRing className="h-4.5 w-4.5 text-amber-500" />
        Needs your attention
      </h2>
      <div className="mt-3 flex flex-col gap-3">
        {visible.map((request) => (
          <Card key={request.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">Guest requested a change</p>
              <p className="text-sm text-zinc-600">
                <Link href={`/listings/${request.listingId}`} className="hover:text-brand-700">
                  {request.listingTitle}
                </Link>{" "}
                · New dates: {request.requestedCheckIn.toLocaleDateString()} –{" "}
                {request.requestedCheckOut.toLocaleDateString()} · {request.requestedGuests} guest
                {request.requestedGuests > 1 ? "s" : ""}
              </p>
              {request.priceDeltaCents !== 0 && (
                <p className="text-sm text-zinc-600">
                  {request.priceDeltaCents > 0
                    ? `Guest will owe an extra ${formatPrice(request.priceDeltaCents)}`
                    : `Guest will be refunded ${formatPrice(Math.abs(request.priceDeltaCents))}`}
                </p>
              )}
            </div>
            <ChangeRequestActions
              bookingId={request.bookingId}
              requestId={request.id}
              onOptimisticStart={() => markHandled(request.id)}
              onError={() => unmarkHandled(request.id)}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}

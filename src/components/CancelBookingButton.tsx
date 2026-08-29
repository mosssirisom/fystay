"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";

export function CancelBookingButton({
  bookingId,
  listingTitle,
  policyLabel,
  policyDescription,
  amountPaidCents,
  refundCents,
  nonRefundableCents,
  onCancelled,
  onCancelFailed,
}: {
  bookingId: string;
  listingTitle: string;
  policyLabel: string;
  policyDescription: string;
  /** All of these are a preview only, computed the same way the server will - the cancel request itself never sends them, and the server recomputes independently. */
  amountPaidCents: number;
  refundCents: number;
  nonRefundableCents: number;
  /** Called immediately on confirm, before the server has responded. */
  onCancelled?: () => void;
  /** Called if the server ultimately rejects the cancellation, to undo the optimistic update. */
  onCancelFailed?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleCancel() {
    // Optimistic: the booking already reads as cancelled the instant the
    // guest confirms; the request below just makes it real in the background.
    setOpen(false);
    onCancelled?.();

    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const refunded = data?.refund?.refundCents ?? 0;
      toast.success(refunded > 0 ? `Booking cancelled. ${formatPrice(refunded)} refunded.` : "Booking cancelled.");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      onCancelFailed?.();
      toast.error(data?.error ?? "Could not cancel booking.");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="focus-ring rounded-lg px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Cancel booking
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Cancel booking">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600">
            Cancel your stay at &quot;{listingTitle}&quot;?
          </p>

          <div className="rounded-lg bg-surface-muted p-3 text-sm">
            <p className="font-medium text-foreground">{policyLabel} cancellation policy</p>
            <p className="mt-0.5 text-zinc-600">{policyDescription}</p>
          </div>

          {amountPaidCents > 0 && (
            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-zinc-600">
                <dt>Amount paid</dt>
                <dd>{formatPrice(amountPaidCents)}</dd>
              </div>
              {nonRefundableCents > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <dt>Non-refundable</dt>
                  <dd>{formatPrice(nonRefundableCents)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border-subtle pt-1.5 font-semibold text-foreground">
                <dt>{refundCents > 0 ? "Final refund amount" : "Refund amount"}</dt>
                <dd>{formatPrice(refundCents)}</dd>
              </div>
            </dl>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep booking
            </Button>
            <Button variant="danger" onClick={handleCancel}>
              Cancel booking
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

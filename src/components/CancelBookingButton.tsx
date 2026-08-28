"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/Dialog";

export function CancelBookingButton({
  bookingId,
  listingTitle,
  onCancelled,
  onCancelFailed,
}: {
  bookingId: string;
  listingTitle: string;
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
      toast.success("Booking cancelled");
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

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleCancel}
        danger
        title="Cancel booking"
        description={`Cancel your stay at "${listingTitle}"? If you already paid, you'll be refunded.`}
        confirmLabel="Cancel booking"
      />
    </>
  );
}

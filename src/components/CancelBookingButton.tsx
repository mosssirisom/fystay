"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/Dialog";

export function CancelBookingButton({
  bookingId,
  listingTitle,
}: {
  bookingId: string;
  listingTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    setOpen(false);

    if (res.ok) {
      toast.success("Booking cancelled");
      router.refresh();
    } else {
      toast.error(data.error ?? "Could not cancel booking.");
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
        loading={loading}
        danger
        title="Cancel booking"
        description={`Cancel your stay at "${listingTitle}"? If you already paid, you'll be refunded.`}
        confirmLabel="Cancel booking"
      />
    </>
  );
}

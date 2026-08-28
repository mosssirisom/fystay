"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function ChangeRequestActions({
  bookingId,
  requestId,
  onOptimisticStart,
  onError,
}: {
  bookingId: string;
  requestId: string;
  /** Called immediately on click, before the server has responded. */
  onOptimisticStart?: () => void;
  /** Called if the server ultimately rejects the response, to undo the optimistic update. */
  onError?: () => void;
}) {
  const router = useRouter();

  async function respond(action: "approve" | "decline") {
    // Optimistic: this banner disappears the instant you click; the request
    // below just makes it real in the background (or brings it back if the
    // approval turns out to no longer be possible, e.g. the dates got taken).
    onOptimisticStart?.();

    const res = await fetch(`/api/bookings/${bookingId}/change-requests/${requestId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      toast.success(action === "approve" ? "Change approved" : "Change declined");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      onError?.();
      toast.error(data?.error ?? "Could not respond to this request.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => respond("decline")}>
        Decline
      </Button>
      <Button size="sm" onClick={() => respond("approve")}>
        Approve
      </Button>
    </div>
  );
}

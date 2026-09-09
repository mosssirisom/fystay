"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function BookingRequestActions({
  bookingId,
  onOptimisticStart,
  onError,
}: {
  bookingId: string;
  /** Called immediately on click, before the server has responded. */
  onOptimisticStart?: () => void;
  /** Called if the server ultimately rejects the response, to undo the optimistic update. */
  onError?: () => void;
}) {
  const router = useRouter();

  async function respond(action: "approve" | "decline") {
    onOptimisticStart?.();

    const res = await fetch(`/api/bookings/${bookingId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      toast.success(action === "approve" ? "Request approved" : "Request declined");
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

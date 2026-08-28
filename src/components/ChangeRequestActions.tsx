"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function ChangeRequestActions({
  bookingId,
  requestId,
}: {
  bookingId: string;
  requestId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null);

  async function respond(action: "approve" | "decline") {
    setLoading(action);
    const res = await fetch(`/api/bookings/${bookingId}/change-requests/${requestId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setLoading(null);

    if (res.ok) {
      toast.success(action === "approve" ? "Change approved" : "Change declined");
      router.refresh();
    } else {
      toast.error(data.error ?? "Could not respond to this request.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => respond("decline")}
        loading={loading === "decline"}
        disabled={loading !== null}
      >
        Decline
      </Button>
      <Button
        size="sm"
        onClick={() => respond("approve")}
        loading={loading === "approve"}
        disabled={loading !== null}
      >
        Approve
      </Button>
    </div>
  );
}

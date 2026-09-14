"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

/**
 * The two decisions an admin can make on an OPEN ReviewReport - only
 * rendered for reports still in that state (see /admin/review-reports),
 * since a DISMISSED or ACTIONED report has already had its outcome
 * recorded and canActionReport (src/lib/reviews.ts) refuses to redo it.
 */
export function ReviewReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState<"dismiss" | "remove" | null>(null);

  async function post(action: "dismiss" | "remove-review") {
    setLoading(action === "dismiss" ? "dismiss" : "remove");
    const res = await fetch(`/api/admin/review-reports/${reportId}/${action}`, {
      method: "POST",
    });
    const data = await res.json().catch(() => null);
    setLoading(null);

    if (!res.ok) {
      toast.error(data?.error ?? "That didn't go through.");
      return;
    }
    toast.success(action === "dismiss" ? "Report dismissed" : "Review removed");
    setConfirmOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={loading === "dismiss"}
          onClick={() => post("dismiss")}
        >
          Dismiss
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => setConfirmOpen(true)}
        >
          Remove review
        </Button>
      </div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Remove this review?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-stone-600">
            The review will be hidden from the listing and the host&apos;s reviews page
            immediately. This also closes out any other open reports against the same review.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Never mind
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={loading === "remove"}
              onClick={() => post("remove-review")}
            >
              Remove review
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

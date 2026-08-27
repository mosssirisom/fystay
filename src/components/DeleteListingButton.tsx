"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/Dialog";

export function DeleteListingButton({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    setLoading(false);
    setOpen(false);

    if (res.ok) {
      toast.success("Listing deleted");
      router.refresh();
    } else {
      toast.error("Could not delete listing.");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="focus-ring flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
        danger
        title="Delete listing"
        description={`Delete "${listingTitle}"? This cannot be undone, and any bookings tied to it will remain in your history.`}
        confirmLabel="Delete"
      />
    </>
  );
}

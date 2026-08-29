"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";

export function WishlistItem({
  listing,
  propertyTypeLabel,
}: {
  listing: ListingCardData;
  propertyTypeLabel: string;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listing.id }),
    });

    if (!res.ok) {
      setRemoving(false);
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not remove from wishlist.");
      return;
    }

    toast.success("Removed from wishlist");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <ListingCard listing={listing} isSaved isLoggedIn />
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-zinc-500">{propertyTypeLabel}</span>
        <Button variant="outline" size="sm" onClick={handleRemove} loading={removing}>
          Remove
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

export function SaveButton({
  listingId,
  initialSaved,
  isLoggedIn,
  className,
}: {
  listingId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not update wishlist.");
      return;
    }

    setSaved(data.saved);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105 disabled:opacity-70",
        className,
      )}
    >
      <Heart
        className={cn("h-4.5 w-4.5", saved ? "fill-red-500 text-red-500" : "text-zinc-600")}
      />
    </button>
  );
}

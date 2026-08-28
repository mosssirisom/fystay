"use client";

import { useRef, useState } from "react";
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
  // Guards against a second click firing a request while one is already in
  // flight, without blocking the instant visual toggle on the first click.
  const pendingRef = useRef(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pendingRef.current) return;

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // Optimistic: flip the heart immediately, reconcile with the server in
    // the background, and roll back only if the request actually fails.
    const optimisticSaved = !saved;
    setSaved(optimisticSaved);
    pendingRef.current = true;

    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    pendingRef.current = false;

    if (!res.ok) {
      setSaved(!optimisticSaved);
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not update wishlist.");
      return;
    }

    const data = await res.json();
    setSaved(data.saved);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-4.5 w-4.5 transition-transform",
          saved ? "scale-110 fill-red-500 text-red-500" : "text-zinc-600",
        )}
      />
    </button>
  );
}

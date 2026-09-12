"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function TogglePromoCodeButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const res = await fetch(`/api/admin/promo-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not update promo code.");
      return;
    }
    toast.success(active ? "Promo code deactivated" : "Promo code reactivated");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" loading={loading} onClick={handleToggle}>
      {active ? "Deactivate" : "Reactivate"}
    </Button>
  );
}

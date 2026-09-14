"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

/**
 * Shared by both provider rows and offering rows on /admin/extras - the
 * PATCH shape (`{ active }`) and behavior are identical for both, only the
 * endpoint and the noun in the toast differ.
 */
export function ToggleExtraActiveButton({
  endpoint,
  active,
  noun,
}: {
  endpoint: string;
  active: boolean;
  noun: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? `Could not update this ${noun}.`);
      return;
    }
    toast.success(active ? `${noun} deactivated` : `${noun} reactivated`);
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" loading={loading} onClick={handleToggle}>
      {active ? "Deactivate" : "Reactivate"}
    </Button>
  );
}

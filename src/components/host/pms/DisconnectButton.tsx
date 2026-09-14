"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";

export function DisconnectButton({ providerPath, label }: { providerPath: string; label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    const res = await fetch(`/api/host/pms/connections/${providerPath}`, { method: "DELETE" });
    const data = await res.json();
    setDisconnecting(false);
    setOpen(false);
    if (!res.ok) {
      toast.error(data.error ?? "Couldn't disconnect.");
      return;
    }
    toast.success(`Disconnected from ${label}`);
    router.push("/host/integrations");
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Disconnect
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDisconnect}
        title={`Disconnect ${label}?`}
        description="Your room mappings and sync history are kept, so reconnecting later won't require setting them up again. Availability, rates and bookings will stop syncing until you reconnect."
        confirmLabel="Disconnect"
        loading={disconnecting}
        danger
      />
    </>
  );
}

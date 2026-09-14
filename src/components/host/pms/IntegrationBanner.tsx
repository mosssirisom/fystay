"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PMS_PROVIDER_LABEL } from "@/lib/pms/registry";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "You need to be signed in as a host to connect an integration.",
  unknown_provider: "That provider isn't supported.",
  missing_code: "The connection was cancelled before it finished.",
  invalid_state: "That connection request expired or was tampered with - please try again.",
  unsupported: "That provider doesn't support this connection method yet.",
  exchange_failed: "Couldn't finish connecting - please try again.",
};

/**
 * Shows a one-time toast for the OAuth callback route's own
 * ?pms_connected=/?pms_error= query params, then strips them from the URL
 * so a page refresh doesn't repeat the toast.
 */
export function IntegrationBanner({
  connectedProvider,
  errorReason,
}: {
  connectedProvider?: string;
  errorReason?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (connectedProvider) {
      const label = PMS_PROVIDER_LABEL[connectedProvider as keyof typeof PMS_PROVIDER_LABEL] ?? connectedProvider;
      toast.success(`Connected to ${label} - choose which property to import from below.`);
      router.replace("/host/integrations");
    } else if (errorReason) {
      toast.error(ERROR_MESSAGES[errorReason] ?? "Couldn't complete that connection.");
      router.replace("/host/integrations");
    }
    // Only ever meant to fire once, off the URL this page was first loaded
    // with - router is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedProvider, errorReason]);

  return null;
}

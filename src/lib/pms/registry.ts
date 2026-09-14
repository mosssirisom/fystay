import type { PmsProvider } from "@prisma/client";
import type { PmsAdapter } from "@/lib/pms/types";
import { cloudbedsAdapter } from "@/lib/pms/providers/cloudbeds";
import { siteminderAdapter } from "@/lib/pms/providers/siteminder";
import { supercontrolAdapter } from "@/lib/pms/providers/supercontrol";

/**
 * The one place that maps a PmsProvider to its adapter implementation.
 * Everything else in src/lib/pms/ and the API routes under
 * src/app/api/host/pms/ resolves an adapter through this function rather
 * than importing a provider file directly, so adding a real fourth
 * provider later is exactly two changes: a new file implementing
 * PmsAdapter, and one new entry here.
 */
const ADAPTERS: Record<PmsProvider, PmsAdapter> = {
  CLOUDBEDS: cloudbedsAdapter,
  SITEMINDER: siteminderAdapter,
  SUPERCONTROL: supercontrolAdapter,
};

export function getPmsAdapter(provider: PmsProvider): PmsAdapter {
  return ADAPTERS[provider];
}

/** Providers with a real (non-stub) implementation, for the "Connect" UI to show as actually connectable today rather than listing every enum value as equally ready. */
export const LIVE_PMS_PROVIDERS: PmsProvider[] = ["CLOUDBEDS"];

export const PMS_PROVIDER_LABEL: Record<PmsProvider, string> = {
  CLOUDBEDS: "Cloudbeds",
  SITEMINDER: "SiteMinder",
  SUPERCONTROL: "SuperControl",
};

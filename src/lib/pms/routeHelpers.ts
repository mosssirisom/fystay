import type { PmsProvider } from "@prisma/client";

const VALID_PROVIDERS: PmsProvider[] = ["CLOUDBEDS", "SITEMINDER", "SUPERCONTROL"];

/** Validates a route's [provider] path segment against the real enum - every /api/host/pms/connections/[provider]/* route starts with this rather than trusting the URL segment is one of the three valid values. */
export function parseProvider(value: string): PmsProvider | null {
  const upper = value.toUpperCase();
  return (VALID_PROVIDERS as string[]).includes(upper) ? (upper as PmsProvider) : null;
}

/**
 * The shared secret a provider signs its webhook deliveries with, read from
 * a per-provider env var. Separate from that provider's OAuth
 * client id/secret (a webhook signing key is a distinct credential in every
 * PMS's own docs) - unset for a provider with no confirmed webhook signing
 * scheme yet, in which case its adapter's verifyWebhookSignature is expected
 * to fail closed regardless of what's passed here (see cloudbeds.ts).
 */
export function pmsWebhookSecret(provider: PmsProvider): string {
  switch (provider) {
    case "CLOUDBEDS":
      return process.env.CLOUDBEDS_WEBHOOK_SECRET ?? "";
    case "SITEMINDER":
      return process.env.SITEMINDER_WEBHOOK_SECRET ?? "";
    case "SUPERCONTROL":
      return process.env.SUPERCONTROL_WEBHOOK_SECRET ?? "";
  }
}

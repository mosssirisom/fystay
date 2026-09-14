import type { PmsProvider } from "@prisma/client";
import { PmsAdapterError } from "@/lib/pms/types";

/**
 * Shared "not yet built" error for a stub provider adapter
 * (siteminder.ts, supercontrol.ts) - non-retryable, since retrying an
 * unimplemented call would never succeed. Kept as one helper so every stub
 * method raises the exact same, clearly-worded error rather than each
 * writing its own slightly different message.
 */
export function notConfigured(provider: PmsProvider, method: string): never {
  throw new PmsAdapterError(
    `${provider} is not yet implemented (called ${method}). This provider satisfies the PmsAdapter interface so it plugs into the same connect/sync/mapping architecture as Cloudbeds, but its real API calls still need to be written once credentials and API documentation for it are available.`,
    { retryable: false },
  );
}

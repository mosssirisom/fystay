import type { PmsAdapter } from "@/lib/pms/types";
import { notConfigured } from "@/lib/pms/providers/notConfigured";

/**
 * SiteMinder is a channel manager, not a PMS itself - it typically connects
 * via its own "Exchange" API (OAuth2) and syncs inventory/rates/
 * restrictions/reservations the same shape as any other channel in the
 * adapter interface below. No SiteMinder API credentials or documentation
 * were available to build against, so every method here satisfies
 * PmsAdapter's shape (so it registers, appears in the UI, and plugs into
 * the same connect/sync/mapping flow as Cloudbeds) but raises a clear
 * "not yet implemented" error rather than guessing at real endpoints - see
 * notConfigured.ts. Once real API docs/credentials are available, this
 * file is where the actual HTTP calls replace these stubs; nothing else in
 * src/lib/pms/ or the API routes needs to change.
 */
export const siteminderAdapter: PmsAdapter = {
  provider: "SITEMINDER",
  authMethod: "oauth2",
  supportsWebhooks: false,

  getAuthorizationUrl() {
    return notConfigured("SITEMINDER", "getAuthorizationUrl");
  },
  async exchangeCodeForCredentials() {
    return notConfigured("SITEMINDER", "exchangeCodeForCredentials");
  },
  async refreshCredentials() {
    return notConfigured("SITEMINDER", "refreshCredentials");
  },
  async listProperties() {
    return notConfigured("SITEMINDER", "listProperties");
  },
  async listRooms() {
    return notConfigured("SITEMINDER", "listRooms");
  },
  async getAvailability() {
    return notConfigured("SITEMINDER", "getAvailability");
  },
  async getRates() {
    return notConfigured("SITEMINDER", "getRates");
  },
  async getRestrictions() {
    return notConfigured("SITEMINDER", "getRestrictions");
  },
  async listReservations() {
    return notConfigured("SITEMINDER", "listReservations");
  },
  async createReservation() {
    return notConfigured("SITEMINDER", "createReservation");
  },
  async cancelReservation() {
    return notConfigured("SITEMINDER", "cancelReservation");
  },
};

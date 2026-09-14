import type { PmsAdapter } from "@/lib/pms/types";
import { notConfigured } from "@/lib/pms/providers/notConfigured";

/**
 * SuperControl is a holiday-let PMS aimed at independent/small-portfolio
 * hosts - a natural fit for FYStay's own Fylde Coast hosts, but no
 * SuperControl API credentials or documentation were available to build
 * against (SuperControl's own public API surface, if any beyond its iCal
 * export, wasn't confirmed). Same reasoning as siteminder.ts: every method
 * satisfies PmsAdapter's shape so it plugs into the same architecture, but
 * raises "not yet implemented" rather than guessing at real endpoints.
 * authMethod is api_key here as a placeholder - confirm SuperControl's
 * actual auth model (API key vs OAuth) once real docs are available, since
 * that also determines which host-facing "Connect" UI (an OAuth redirect
 * vs an API-key input form) is correct for it.
 */
export const supercontrolAdapter: PmsAdapter = {
  provider: "SUPERCONTROL",
  authMethod: "api_key",
  supportsWebhooks: false,

  async verifyApiKeyCredentials() {
    return notConfigured("SUPERCONTROL", "verifyApiKeyCredentials");
  },
  async listProperties() {
    return notConfigured("SUPERCONTROL", "listProperties");
  },
  async listRooms() {
    return notConfigured("SUPERCONTROL", "listRooms");
  },
  async getAvailability() {
    return notConfigured("SUPERCONTROL", "getAvailability");
  },
  async getRates() {
    return notConfigured("SUPERCONTROL", "getRates");
  },
  async getRestrictions() {
    return notConfigured("SUPERCONTROL", "getRestrictions");
  },
  async listReservations() {
    return notConfigured("SUPERCONTROL", "listReservations");
  },
  async createReservation() {
    return notConfigured("SUPERCONTROL", "createReservation");
  },
  async cancelReservation() {
    return notConfigured("SUPERCONTROL", "cancelReservation");
  },
};

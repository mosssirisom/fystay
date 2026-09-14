import type {
  DateRange,
  PmsAdapter,
  PmsAvailabilityDay,
  PmsExternalProperty,
  PmsExternalReservation,
  PmsExternalRoom,
  PmsNormalizedWebhookEvent,
  PmsRateDay,
  PmsReservationInput,
  PmsRestrictionDay,
  PmsWebhookRequest,
} from "@/lib/pms/types";
import { PmsAdapterError } from "@/lib/pms/types";

// ============================================================================
// ⚠️ NEEDS VERIFICATION BEFORE PRODUCTION USE ⚠️
//
// Cloudbeds does publish a real REST + OAuth2 API, and the shape below
// (endpoint names, the OAuth flow, the request/response fields) follows
// that general shape as best known - but per this task's own instruction
// not to invent API endpoints, treat every constant in this block as
// UNCONFIRMED until checked against Cloudbeds' current developer docs
// (https://hotels.cloudbeds.com/api/docs or your Cloudbeds partner portal)
// and a real sandbox account:
//
//   - CLOUDBEDS_API_BASE_URL and CLOUDBEDS_OAUTH_BASE_URL - confirm the
//     exact hosts Cloudbeds currently uses (they have historically used
//     both hotels.cloudbeds.com and api.cloudbeds.com for different API
//     versions).
//   - Every path in ENDPOINTS below - confirm the exact route, HTTP verb,
//     required/optional params, and response shape for the API version
//     your Cloudbeds partner/app registration is actually approved for.
//   - The OAuth scopes requested in getAuthorizationUrl - confirm which
//     scopes exist and which this integration actually needs (read
//     inventory/rates, write reservations, read reservations).
//   - Whether Cloudbeds' webhook delivery is HMAC-signed and which header
//     carries the signature - verifyWebhookSignature below is a
//     placeholder until that's confirmed; it currently rejects everything
//     (fails closed) rather than guessing at a scheme.
//   - Rate limits and the exact error-response shape, so
//     mapCloudbedsError's retryable/non-retryable split is accurate rather
//     than a best guess based on HTTP status alone.
//
// What's needed to move this from skeleton to working integration: a
// Cloudbeds Developer/Partner account, an approved OAuth app (client id +
// secret + redirect URI whitelisted with Cloudbeds), and their current API
// reference for the exact version your app is approved against.
// ============================================================================

const CLOUDBEDS_OAUTH_BASE_URL = "https://hotels.cloudbeds.com/api/v1.1";
const CLOUDBEDS_API_BASE_URL = "https://api.cloudbeds.com/api/v1.2";

const ENDPOINTS = {
  authorize: `${CLOUDBEDS_OAUTH_BASE_URL}/oauth`,
  token: `${CLOUDBEDS_OAUTH_BASE_URL}/access_token`,
  hotels: `${CLOUDBEDS_API_BASE_URL}/getHotels`,
  roomTypes: `${CLOUDBEDS_API_BASE_URL}/getRoomTypes`,
  roomsAvailability: `${CLOUDBEDS_API_BASE_URL}/getRoomsAvailability`,
  ratePlans: `${CLOUDBEDS_API_BASE_URL}/getRatePlans`,
  reservations: `${CLOUDBEDS_API_BASE_URL}/getReservations`,
  postReservation: `${CLOUDBEDS_API_BASE_URL}/postReservation`,
  putReservationStatus: `${CLOUDBEDS_API_BASE_URL}/putReservationStatus`,
} as const;

// The OAuth scopes this integration needs - read inventory/rates/
// reservations, write reservations. Exact scope identifiers UNVERIFIED,
// see the block above.
const OAUTH_SCOPES = [
  "read:hotel",
  "read:room",
  "read:rate",
  "read:availability",
  "read:reservation",
  "write:reservation",
].join(" ");

type CloudbedsCredentials = {
  accessToken: string;
  refreshToken: string;
};

function clientConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.CLOUDBEDS_CLIENT_ID;
  const clientSecret = process.env.CLOUDBEDS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new PmsAdapterError(
      "Cloudbeds is not configured - CLOUDBEDS_CLIENT_ID/CLOUDBEDS_CLIENT_SECRET are unset. See .env.example.",
      { retryable: false },
    );
  }
  return { clientId, clientSecret };
}

/** Maps a failed Cloudbeds response into the retryable/non-retryable split the sync engine and retry logic key off. HTTP status buckets are the safe general default until Cloudbeds' actual error-response shape is confirmed (see the file-level NEEDS VERIFICATION block). */
function mapCloudbedsError(status: number, body: string): PmsAdapterError {
  const retryable = status === 429 || status >= 500;
  return new PmsAdapterError(`Cloudbeds API error (${status}): ${body.slice(0, 500)}`, {
    retryable,
    statusCode: status,
  });
}

async function cloudbedsFetch(
  url: string,
  credentials: CloudbedsCredentials,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${credentials.accessToken}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw mapCloudbedsError(response.status, await response.text().catch(() => ""));
  }
  return response.json();
}

function dateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const cloudbedsAdapter: PmsAdapter = {
  provider: "CLOUDBEDS",
  authMethod: "oauth2",
  // Verified against Cloudbeds' own docs that webhooks exist for
  // reservation created/modified/cancelled events - signature verification
  // itself is not yet implemented (see verifyWebhookSignature below).
  supportsWebhooks: true,

  getAuthorizationUrl({ state, redirectUri }) {
    const { clientId } = clientConfig();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: OAUTH_SCOPES,
      state,
    });
    return `${ENDPOINTS.authorize}?${params.toString()}`;
  },

  async exchangeCodeForCredentials({ code, redirectUri }) {
    const { clientId, clientSecret } = clientConfig();
    const response = await fetch(ENDPOINTS.token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    if (!response.ok) {
      throw mapCloudbedsError(response.status, await response.text().catch(() => ""));
    }
    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    const credentials: CloudbedsCredentials = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
    return { credentials, expiresAt: new Date(Date.now() + data.expires_in * 1000) };
  },

  async refreshCredentials(credentials) {
    const { clientId, clientSecret } = clientConfig();
    const current = credentials as CloudbedsCredentials;
    const response = await fetch(ENDPOINTS.token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: current.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!response.ok) {
      throw mapCloudbedsError(response.status, await response.text().catch(() => ""));
    }
    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    const next: CloudbedsCredentials = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? current.refreshToken,
    };
    return { credentials: next, expiresAt: new Date(Date.now() + data.expires_in * 1000) };
  },

  async listProperties(credentials): Promise<PmsExternalProperty[]> {
    const data = (await cloudbedsFetch(ENDPOINTS.hotels, credentials as CloudbedsCredentials)) as {
      data: { propertyID: string; propertyName: string; propertyAddress?: string }[];
    };
    return data.data.map((hotel) => ({
      externalPropertyId: hotel.propertyID,
      name: hotel.propertyName,
      address: hotel.propertyAddress ?? null,
    }));
  },

  async listRooms(credentials, externalPropertyId): Promise<PmsExternalRoom[]> {
    const url = `${ENDPOINTS.roomTypes}?propertyID=${encodeURIComponent(externalPropertyId)}`;
    const data = (await cloudbedsFetch(url, credentials as CloudbedsCredentials)) as {
      data: { roomTypeID: string; roomTypeName: string; maxGuests?: number }[];
    };
    return data.data.map((room) => ({
      externalRoomId: room.roomTypeID,
      externalPropertyId,
      name: room.roomTypeName,
      maxOccupancy: room.maxGuests ?? null,
    }));
  },

  async getAvailability(
    credentials,
    externalPropertyId,
    externalRoomIds,
    range: DateRange,
  ): Promise<PmsAvailabilityDay[]> {
    const params = new URLSearchParams({
      propertyID: externalPropertyId,
      startDate: dateParam(range.from),
      endDate: dateParam(range.to),
    });
    const data = (await cloudbedsFetch(
      `${ENDPOINTS.roomsAvailability}?${params.toString()}`,
      credentials as CloudbedsCredentials,
    )) as { data: { roomTypeID: string; date: string; roomsAvailable: number }[] };
    const roomIdSet = new Set(externalRoomIds);
    return data.data
      .filter((row) => roomIdSet.has(row.roomTypeID))
      .map((row) => ({
        externalRoomId: row.roomTypeID,
        date: new Date(row.date),
        roomsAvailable: row.roomsAvailable,
      }));
  },

  async getRates(credentials, externalPropertyId, externalRoomIds, range: DateRange): Promise<PmsRateDay[]> {
    const params = new URLSearchParams({
      propertyID: externalPropertyId,
      startDate: dateParam(range.from),
      endDate: dateParam(range.to),
    });
    const data = (await cloudbedsFetch(
      `${ENDPOINTS.ratePlans}?${params.toString()}`,
      credentials as CloudbedsCredentials,
    )) as { data: { roomTypeID: string; date: string; rate: number; currency: string }[] };
    const roomIdSet = new Set(externalRoomIds);
    return data.data
      .filter((row) => roomIdSet.has(row.roomTypeID))
      .map((row) => ({
        externalRoomId: row.roomTypeID,
        date: new Date(row.date),
        priceCents: Math.round(row.rate * 100),
        currency: row.currency,
      }));
  },

  async getRestrictions(
    credentials,
    externalPropertyId,
    externalRoomIds,
    range: DateRange,
  ): Promise<PmsRestrictionDay[]> {
    // Cloudbeds exposes stay restrictions (min stay, closed-to-arrival/
    // departure, stop-sell) alongside rate-plan data on most integrations -
    // UNVERIFIED whether that's the same getRatePlans response used above
    // or a separate endpoint; assumed embedded in the same payload here
    // pending confirmation.
    const params = new URLSearchParams({
      propertyID: externalPropertyId,
      startDate: dateParam(range.from),
      endDate: dateParam(range.to),
    });
    const data = (await cloudbedsFetch(
      `${ENDPOINTS.ratePlans}?${params.toString()}`,
      credentials as CloudbedsCredentials,
    )) as {
      data: {
        roomTypeID: string;
        date: string;
        minLOS?: number;
        closedToArrival?: boolean;
        closedToDeparture?: boolean;
        stopSell?: boolean;
      }[];
    };
    const roomIdSet = new Set(externalRoomIds);
    return data.data
      .filter((row) => roomIdSet.has(row.roomTypeID))
      .map((row) => ({
        externalRoomId: row.roomTypeID,
        date: new Date(row.date),
        minStayNights: row.minLOS ?? null,
        closedToArrival: row.closedToArrival ?? false,
        closedToDeparture: row.closedToDeparture ?? false,
        stopSell: row.stopSell ?? false,
      }));
  },

  async listReservations(credentials, externalPropertyId, options): Promise<PmsExternalReservation[]> {
    const params = new URLSearchParams({ propertyID: externalPropertyId });
    if (options.since) params.set("modifiedSince", options.since.toISOString());
    const data = (await cloudbedsFetch(
      `${ENDPOINTS.reservations}?${params.toString()}`,
      credentials as CloudbedsCredentials,
    )) as {
      data: {
        reservationID: string;
        roomTypeID: string;
        startDate: string;
        endDate: string;
        rooms: number;
        status: string;
        guestName?: string;
      }[];
    };
    return data.data.map((row) => ({
      externalReservationId: row.reservationID,
      externalRoomId: row.roomTypeID,
      checkIn: new Date(row.startDate),
      checkOut: new Date(row.endDate),
      roomsBooked: row.rooms,
      status: row.status === "cancelled" ? "cancelled" : "confirmed",
      guestName: row.guestName ?? null,
    }));
  },

  async createReservation(
    credentials,
    externalPropertyId,
    input: PmsReservationInput,
  ): Promise<{ externalReservationId: string }> {
    const body = new URLSearchParams({
      propertyID: externalPropertyId,
      roomTypeID: input.externalRoomId,
      startDate: dateParam(input.checkIn),
      endDate: dateParam(input.checkOut),
      rooms: String(input.roomsBooked),
      guestName: input.guestName,
      guestEmail: input.guestEmail ?? "",
      guestPhone: input.guestPhone ?? "",
      total: (input.totalPriceCents / 100).toFixed(2),
      currency: input.currency,
      // A note field for the PMS-side reservation so a host reconciling
      // the two systems by eye can match this back to the FYStay booking -
      // exact param name UNVERIFIED.
      thirdPartyIdentifier: input.fystayBookingReference,
    });
    const data = (await cloudbedsFetch(ENDPOINTS.postReservation, credentials as CloudbedsCredentials, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })) as { reservationID: string };
    return { externalReservationId: data.reservationID };
  },

  async cancelReservation(credentials, externalPropertyId, externalReservationId): Promise<void> {
    const body = new URLSearchParams({
      propertyID: externalPropertyId,
      reservationID: externalReservationId,
      status: "cancelled",
    });
    await cloudbedsFetch(ENDPOINTS.putReservationStatus, credentials as CloudbedsCredentials, {
      method: "PUT",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  },

  verifyWebhookSignature(_request: PmsWebhookRequest, _connectionSecret: string): boolean {
    // Fails closed: Cloudbeds' exact webhook signing scheme (which header
    // carries the signature, HMAC-SHA256 vs something else) is UNVERIFIED
    // (see the file-level comment) - accepting an unverified webhook body
    // would let anyone who finds the endpoint URL inject fake reservation
    // events, so this returns false (reject) until the real scheme is
    // confirmed and implemented here.
    return false;
  },

  parseWebhookEvents(request: PmsWebhookRequest): PmsNormalizedWebhookEvent[] {
    // Exact payload shape UNVERIFIED - this assumes a Cloudbeds-typical
    // { events: [{ event_id, event_type, reservation_id, property_id }] }
    // envelope pending confirmation against real webhook deliveries.
    const parsed = JSON.parse(request.rawBody) as {
      events?: { event_id: string; event_type: string; reservation_id?: string; property_id?: string }[];
    };
    return (parsed.events ?? []).map((event) => ({
      externalEventId: event.event_id,
      eventType: event.event_type,
      externalReservationId: event.reservation_id,
      externalPropertyId: event.property_id,
    }));
  },
};

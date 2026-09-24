/**
 * Validates and normalizes raw URL search params into a HotelSearchParams
 * the provider abstraction can be called with - the one place every
 * "invalid dates" / "invalid guest numbers" rule lives (Phase 5's "proper
 * states" requirement), so the search page, the hotel detail page, and any
 * future entry point all agree on exactly the same rules. Mirrors the
 * shape of src/lib/listingSearch.ts's parseListingFiltersFromParams for
 * FYStay's own search - same pattern, different domain.
 */
import { parseGuestParam } from "@/lib/search";
import type { HotelSearchParams } from "@/lib/hotelProviders/types";

export const MAX_ADULTS = 16;
export const MAX_CHILDREN = 16;
export const MAX_ROOMS = 8;
export const MAX_STAY_NIGHTS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type HotelSearchFieldErrors = {
  destination?: string;
  dates?: string;
  guests?: string;
};

export type ParsedHotelSearch =
  | { ok: true; params: HotelSearchParams }
  | { ok: false; errors: HotelSearchFieldErrors };

type RawParams = Record<string, string | string[] | undefined>;

function parseDateParam(value: string | string[] | undefined): Date | null {
  const raw = typeof value === "string" ? value : undefined;
  if (!raw) return null;
  // The literal midnight-local time avoids the classic "yyyy-MM-dd parses
  // as UTC midnight, which is the previous day in a negative-UTC-offset
  // timezone" date-off-by-one bug.
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** `now` is injectable so "check-in can't be in the past" is deterministic to test. */
export function parseHotelSearchParams(raw: RawParams, now: Date = new Date()): ParsedHotelSearch {
  const errors: HotelSearchFieldErrors = {};

  const destination = typeof raw.destination === "string" ? raw.destination.trim() : "";
  if (!destination) {
    errors.destination = "Enter a destination to search.";
  } else if (destination.length > 100) {
    errors.destination = "Destination is too long.";
  }

  const checkIn = parseDateParam(raw.checkIn);
  const checkOut = parseDateParam(raw.checkOut);
  const today = startOfDay(now);
  if (!checkIn || !checkOut) {
    errors.dates = "Choose a check-in and check-out date.";
  } else if (checkIn < today) {
    errors.dates = "Check-in can't be in the past.";
  } else if (checkOut <= checkIn) {
    errors.dates = "Check-out must be after check-in.";
  } else if (Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY) > MAX_STAY_NIGHTS) {
    errors.dates = `Stays longer than ${MAX_STAY_NIGHTS} nights aren't supported yet.`;
  }

  const adults = parseGuestParam(raw.adults, 1);
  const children = parseGuestParam(raw.children, 0);
  const rooms = parseGuestParam(raw.rooms, 1);
  if (adults < 1 || adults > MAX_ADULTS) {
    errors.guests = `Enter between 1 and ${MAX_ADULTS} adults.`;
  } else if (children > MAX_CHILDREN) {
    errors.guests = `Enter up to ${MAX_CHILDREN} children.`;
  } else if (rooms < 1 || rooms > MAX_ROOMS) {
    errors.guests = `Enter between 1 and ${MAX_ROOMS} rooms.`;
  }

  if (errors.destination || errors.dates || errors.guests || !checkIn || !checkOut) {
    return { ok: false, errors };
  }

  return { ok: true, params: { destination, checkIn, checkOut, adults, children, rooms } };
}

function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type HotelStayWindow = { checkIn: Date; checkOut: Date };
export type HotelGuestCounts = { adults: number; children: number; rooms: number };

/**
 * A lenient counterpart to parseHotelSearchParams for the hotel detail page
 * (Phase 5) - that page has no destination param to validate (the
 * destination is the hotel's own city, from the AffiliateHotel cache), and
 * unlike the search page it needs a *fallback*, not an error state, when
 * dates are missing or invalid: a guest arriving from a search result
 * always carries real dates in the URL, but a guest who bookmarked or
 * shared the hotel's own page (no query string at all) should still see
 * live availability for some sensible default stay, not a dead end. Same
 * date rules as parseHotelSearchParams (no past check-in, checkout after
 * check-in, capped stay length) with the last one omitted here - the
 * detail page just wants a searchable window if the caller's origin
 * search hasn't already validated it doesn't matter for defaulting.
 */
export function parseOptionalStayWindow(raw: RawParams, now: Date = new Date()): HotelStayWindow | null {
  const checkIn = parseDateParam(raw.checkIn);
  const checkOut = parseDateParam(raw.checkOut);
  if (!checkIn || !checkOut) return null;
  const today = startOfDay(now);
  if (checkIn < today) return null;
  if (checkOut <= checkIn) return null;
  return { checkIn, checkOut };
}

/** Same leniency as parseOptionalStayWindow, for the guest-count fields. */
export function parseOptionalGuestCounts(raw: RawParams): HotelGuestCounts | null {
  const adults = parseGuestParam(raw.adults, 1);
  const children = parseGuestParam(raw.children, 0);
  const rooms = parseGuestParam(raw.rooms, 1);
  if (adults < 1 || adults > MAX_ADULTS) return null;
  if (children > MAX_CHILDREN) return null;
  if (rooms < 1 || rooms > MAX_ROOMS) return null;
  return { adults, children, rooms };
}

/** The inverse of parseHotelSearchParams - builds the query string HotelSearchForm navigates to. */
export function buildHotelSearchQuery(params: {
  destination: string;
  checkIn?: Date;
  checkOut?: Date;
  adults: number;
  children: number;
  rooms: number;
}): string {
  const search = new URLSearchParams();
  if (params.destination) search.set("destination", params.destination);
  if (params.checkIn) search.set("checkIn", formatDateParam(params.checkIn));
  if (params.checkOut) search.set("checkOut", formatDateParam(params.checkOut));
  if (params.adults !== 1) search.set("adults", String(params.adults));
  if (params.children > 0) search.set("children", String(params.children));
  if (params.rooms !== 1) search.set("rooms", String(params.rooms));
  return search.toString();
}

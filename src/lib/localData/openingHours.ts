/**
 * A deliberately partial OSM opening_hours parser. The full syntax
 * (https://wiki.openstreetmap.org/wiki/Key:opening_hours) covers public
 * holidays, month ranges, "sunrise-sunset", comments and more - trying to
 * support all of it risks confidently misreading an edge case into a wrong
 * open/closed answer, which is worse than just not answering. This handles
 * the common, unambiguous shapes ("24/7", "Mo-Fr 09:00-17:00", multiple
 * day-groups separated by ";", multiple time ranges separated by ",") and
 * returns null - genuinely unknown, not a guess - for anything else.
 */

const DAY_TOKENS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
type DayToken = (typeof DAY_TOKENS)[number];

function dayIndex(token: DayToken): number {
  return DAY_TOKENS.indexOf(token);
}

function parseDayRange(spec: string): number[] | null {
  const days: number[] = [];
  for (const part of spec.split(",")) {
    const range = part.trim().match(/^([A-Za-z]{2})(?:-([A-Za-z]{2}))?$/);
    if (!range) return null;
    const [, startToken, endToken] = range;
    if (!DAY_TOKENS.includes(startToken as DayToken)) return null;
    const start = dayIndex(startToken as DayToken);
    if (!endToken) {
      days.push(start);
      continue;
    }
    if (!DAY_TOKENS.includes(endToken as DayToken)) return null;
    const end = dayIndex(endToken as DayToken);
    for (let i = start; ; i = (i + 1) % 7) {
      days.push(i);
      if (i === end) break;
    }
  }
  return days;
}

function parseTimeRanges(spec: string): { startMinutes: number; endMinutes: number }[] | null {
  const ranges: { startMinutes: number; endMinutes: number }[] = [];
  for (const part of spec.split(",")) {
    const match = part.trim().match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const [, sh, sm, eh, em] = match;
    ranges.push({ startMinutes: Number(sh) * 60 + Number(sm), endMinutes: Number(eh) * 60 + Number(em) });
  }
  return ranges;
}

/**
 * Whether a place is open at `now`, or null when the opening_hours string
 * is missing or uses syntax this parser doesn't confidently understand.
 * Never returns a guess - callers should treat null as "don't know",
 * exactly like a missing rating or price level.
 */
export function isOpenAt(openingHours: string | null | undefined, now: Date): boolean | null {
  if (!openingHours) return null;
  const trimmed = openingHours.trim();
  if (trimmed === "24/7") return true;

  const currentDay = (now.getDay() + 6) % 7; // JS: Sun=0 - shift so Mo=0, matching DAY_TOKENS.
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const group of trimmed.split(";")) {
    const segment = group.trim();
    if (!segment) continue;

    const match = segment.match(/^([A-Za-z,-]+)\s+(.+)$/);
    if (!match) return null;
    const [, dayPart, timePart] = match;

    const days = parseDayRange(dayPart);
    const times = parseTimeRanges(timePart);
    if (!days || !times) return null;

    if (days.includes(currentDay) && times.some((t) => currentMinutes >= t.startMinutes && currentMinutes < t.endMinutes)) {
      return true;
    }
  }
  return false;
}

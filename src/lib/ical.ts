export type IcsEvent = {
  /** Stable across regenerations of the same feed, so a subscribing calendar app updates rather than duplicates this event. */
  uid: string;
  /** Calendar dates (all-day events) - times of day don't matter for a check-in/check-out range. */
  start: Date;
  end: Date;
  summary: string;
};

function formatIcsDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/** RFC 5545 TEXT escaping: backslash, comma, semicolon, and newlines all need escaping in a value. */
function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

/** RFC 5545 requires folding any line over 75 octets onto a continuation line starting with a space. */
function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75));
    rest = rest.slice(75);
  }
  chunks.push(rest);
  return chunks.join("\r\n ");
}

/**
 * A minimal, valid iCalendar (RFC 5545) feed of all-day VEVENTs - enough
 * for Airbnb/Vrbo/Google Calendar to import a listing's confirmed
 * bookings and host-set blocks as unavailable dates elsewhere. Never
 * includes ICAL_IMPORT-sourced blocks: re-exporting an already-imported
 * event back out would create a loop between two synced calendars.
 */
export function generateIcs(params: { calendarName: string; events: IcsEvent[] }): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FYStay//Availability Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(params.calendarName)}`,
  ];

  for (const event of params.events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${formatIcsDate(new Date())}T000000Z`,
      `DTSTART;VALUE=DATE:${formatIcsDate(event.start)}`,
      `DTEND;VALUE=DATE:${formatIcsDate(event.end)}`,
      `SUMMARY:${escapeIcsText(event.summary)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

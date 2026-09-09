export type ParsedIcsEvent = {
  uid: string;
  start: Date;
  end: Date;
};

/** RFC 5545 line unfolding: a continuation line starts with a space or tab and is joined onto the previous line. */
function unfoldLines(text: string): string[] {
  const rawLines = text.split(/\r\n|\r|\n/);
  const unfolded: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

/** Parses VALUE=DATE (YYYYMMDD) and the basic VALUE=DATE-TIME (YYYYMMDDTHHmmss[Z]) forms - the two shapes every real calendar export actually uses for availability blocks. Returns null for anything else rather than guessing. */
function parseIcsDate(value: string): Date | null {
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  }
  const dateTime = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(value);
  if (dateTime) {
    const [, y, m, d, hh, mm, ss] = dateTime;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)));
  }
  return null;
}

/**
 * Extracts UID/DTSTART/DTEND from every VEVENT in a raw .ics feed. Events
 * missing any of the three, or with an unparseable date, are silently
 * skipped rather than thrown on - one malformed event in someone else's
 * export shouldn't take down the sync for every other event in the same
 * feed. A property line's parameters (e.g. "DTSTART;VALUE=DATE:...") are
 * ignored beyond the property name itself; only the value after the last
 * colon is read.
 */
export function parseIcsEvents(text: string): ParsedIcsEvent[] {
  const lines = unfoldLines(text);
  const events: ParsedIcsEvent[] = [];

  let current: { uid?: string; start?: Date; end?: Date } | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current?.uid && current.start && current.end) {
        events.push({ uid: current.uid, start: current.start, end: current.end });
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const rawName = line.slice(0, colonIndex);
    const value = line.slice(colonIndex + 1);
    const propertyName = rawName.split(";")[0].toUpperCase();

    if (propertyName === "UID") {
      current.uid = value.trim();
    } else if (propertyName === "DTSTART") {
      current.start = parseIcsDate(value.trim()) ?? undefined;
    } else if (propertyName === "DTEND") {
      current.end = parseIcsDate(value.trim()) ?? undefined;
    }
  }

  return events;
}

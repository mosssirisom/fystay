import { format } from "date-fns";
import { CalendarDays, ExternalLink } from "lucide-react";
import type { LocalEvent } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";

const MAX_EVENTS = 8;

function isDuringStay(event: LocalEvent, checkIn: Date | null, checkOut: Date | null): boolean {
  if (!checkIn || !checkOut) return false;
  return event.startsAt >= checkIn && event.startsAt <= checkOut;
}

/**
 * Every upcoming, ticketed event FYStay actually knows about for this town
 * (Ticketmaster Discovery, cached - see src/lib/localData/events.ts),
 * soonest first. When the guest has real check-in/check-out dates (the
 * same `checkIn`/`checkOut` search params the booking search itself
 * uses), anything falling inside their stay is badged rather than
 * filtered out entirely - a guest can still see what's on either side of
 * their trip, which matters for anyone still deciding on dates.
 *
 * With no TICKETMASTER_API_KEY configured, events.ts already returns an
 * empty list rather than failing - this renders one honest line instead
 * of a broken section, never a fabricated "nothing's on".
 */
export function WhatsOn({
  destinationName,
  events,
  checkIn,
  checkOut,
}: {
  destinationName: string;
  events: LocalEvent[];
  checkIn: Date | null;
  checkOut: Date | null;
}) {
  return (
    <section id="whats-on" className="mt-10 scroll-mt-36">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <CalendarDays className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-lg font-semibold text-foreground">What&apos;s On</p>
      </div>
      <p className="mt-1.5 max-w-2xl text-sm text-stone-600">
        Live events and entertainment in {destinationName}
        {checkIn && checkOut ? " - anything during your stay is marked below." : "."}
      </p>

      {events.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border-subtle bg-surface-muted p-5 text-sm text-stone-500">
          No upcoming events found for {destinationName} yet.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
          {events.slice(0, MAX_EVENTS).map((event) => {
            const duringStay = isDuringStay(event, checkIn, checkOut);
            return (
              <li key={event.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{event.name}</p>
                    {duringStay && <Badge variant="brand">During your stay</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-stone-500">
                    {format(event.startsAt, "EEE d MMM, HH:mm")}
                    {event.venueName && ` · ${event.venueName}`}
                  </p>
                </div>
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
                  >
                    Details
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

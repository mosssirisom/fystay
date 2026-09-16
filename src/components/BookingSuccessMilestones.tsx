"use client";

import { useEffect, useState } from "react";
import { CalendarCheck2, BellRing, BookmarkCheck } from "lucide-react";

const MILESTONES = [
  { icon: CalendarCheck2, label: "Your dates are locked in" },
  { icon: BellRing, label: "Your host has been notified" },
  { icon: BookmarkCheck, label: "Saved to My Trips" },
] as const;

const MILESTONE_STAGGER_MS = 220;
const MILESTONE_START_DELAY_MS = 300;
const COUNT_UP_DURATION_MS = 700;
// Kept equal to milestone-chip-in's own animation-delay in globals.css, so
// the countdown chip pops into view right as its digits start counting -
// two halves of one beat, not two unrelated things happening near each
// other.
const COUNT_UP_START_DELAY_MS = 850;

function daysUntilCheckIn(checkIn: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((checkIn.getTime() - Date.now()) / msPerDay));
}

/**
 * The "quest complete" beat right after a payment actually clears: three
 * true facts about what just happened, ticking in one at a time, then a
 * countdown chip that counts up to the real number of days until check-in
 * rather than just appearing with the number already on it. This is the
 * one moment in the booking flow built to feel like a small reward rather
 * than a receipt - everything else on this screen (BookingSummaryCard) is
 * still the plain, scannable record of what was actually paid.
 */
export function BookingSuccessMilestones({ checkIn }: { checkIn: Date }) {
  const targetDays = daysUntilCheckIn(checkIn);
  const [displayDays, setDisplayDays] = useState(0);

  useEffect(() => {
    if (targetDays === 0) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame: number;
    const startTimer = setTimeout(
      () => {
        if (reducedMotion) {
          setDisplayDays(targetDays);
          return;
        }
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / COUNT_UP_DURATION_MS, 1);
          setDisplayDays(Math.round(progress * targetDays));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      reducedMotion ? 0 : COUNT_UP_START_DELAY_MS,
    );

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(frame);
    };
  }, [targetDays]);

  return (
    <div className="mt-5 flex w-full flex-col items-center gap-4">
      <ul className="flex flex-col gap-2">
        {MILESTONES.map(({ icon: Icon, label }, i) => (
          <li
            key={label}
            className="milestone-in flex items-center gap-2.5 text-sm text-foreground"
            style={{ animationDelay: `${MILESTONE_START_DELAY_MS + i * MILESTONE_STAGGER_MS}ms` }}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            {label}
          </li>
        ))}
      </ul>

      {targetDays > 0 && (
        <div className="milestone-chip-in inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-800">
          <span className="font-serif text-base tabular-nums">{displayDays}</span>
          {displayDays === 1 ? "day until check-in" : "days until check-in"}
        </div>
      )}
    </div>
  );
}

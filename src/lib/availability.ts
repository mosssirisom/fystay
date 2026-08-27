import { differenceInCalendarDays } from "date-fns";

export type BookedRange = { checkIn: Date; checkOut: Date };

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function isRangeAvailable(
  checkIn: Date,
  checkOut: Date,
  bookedRanges: BookedRange[],
): boolean {
  if (checkOut <= checkIn) return false;
  return bookedRanges.every(
    (range) => !rangesOverlap(checkIn, checkOut, range.checkIn, range.checkOut),
  );
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.max(0, differenceInCalendarDays(checkOut, checkIn));
}

/** Same invalid-range rule a booking date range is held to. */
export function isValidBlockRange(startDate: Date, endDate: Date): boolean {
  return endDate > startDate;
}

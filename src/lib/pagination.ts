/**
 * Generic page-number parsing and array slicing - originally lived in
 * listingSearch.ts (search results was the first list this app paginated)
 * but is used for any long, already-filtered/sorted list rendered a page
 * at a time (search results, a guest's trips, a host's own listings), so
 * it lives here instead of implying it's listings-specific.
 */
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(raw) && raw > 0 ? raw : 1;
}

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  totalPages: number;
  totalCount: number;
};

/**
 * Slices an already-filtered-and-sorted result array down to one page.
 * `page` is clamped into range rather than trusted as-is, so a stale or
 * hand-edited `?page=` past the end (e.g. after a filter narrows the
 * result set) falls back to the last real page instead of rendering
 * empty - the same "don't trust the client, don't crash on it either"
 * treatment every other search param on this page already gets.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: clampedPage, totalPages, totalCount };
}

/**
 * Small shared constants/helpers for page metadata - split out so the same
 * site URL and brand name aren't re-declared (and liable to drift) across
 * layout.tsx, sitemap.ts, robots.ts and every page that builds its own
 * canonical/OG URLs. Deliberately limited to metadata concerns: functional
 * code (email links, redirect URLs) keeps its own NEXT_PUBLIC_BASE_URL
 * fallback rather than depending on this file.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const SITE_NAME = "FYstay";

/**
 * A listing's own title usually already names its town (hosts write things
 * like "Cosy cottage near Fleetwood Marina"), so appending the city again
 * would just repeat it. Only add "in {city}" when the title doesn't already
 * mention it, so every listing page's <title> and image alt text carry a
 * real location signal without ever duplicating one.
 */
export function withCity(title: string, city: string): string {
  return title.toLowerCase().includes(city.toLowerCase()) ? title : `${title} in ${city}`;
}

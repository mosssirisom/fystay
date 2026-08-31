import { cn } from "@/lib/cn";

/**
 * A generated, on-brand coastal scene (pier, tower silhouette, sea) used as
 * the homepage's full-bleed hero backdrop. Deliberately not a hotlinked
 * stock photo: this codebase's own seed data already avoids that ("renders
 * instantly with zero external requests, so the demo never depends on a
 * third-party image host being reachable" - prisma/seed.ts) and this hero
 * is the single most-loaded image on the site, so the same reasoning
 * applies even more strongly here.
 */
export function HeroBanner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 420"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      // The browser's default "clip to box" rule for SVG only applies to a
      // *nested* <svg>, not the root one - since preserveAspectRatio=slice
      // deliberately scales this scene wider than its box to fill it, the
      // un-clipped root svg was pushing real horizontal overflow onto the
      // whole page (the wrapping section's own overflow-hidden didn't
      // catch it), so this has to clip itself explicitly.
      className={cn("overflow-hidden", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#042f2c" />
          <stop offset="55%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <radialGradient id="hero-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#115e59" />
          <stop offset="100%" stopColor="#042f2c" />
        </linearGradient>
      </defs>

      <rect width="1440" height="420" fill="url(#hero-sky)" />
      <circle cx="1120" cy="150" r="150" fill="url(#hero-sun)" />
      <circle cx="1120" cy="150" r="46" fill="#fef3c7" fillOpacity="0.9" />

      {/* Sea */}
      <rect y="300" width="1440" height="120" fill="url(#hero-sea)" />
      <path
        d="M0 300c60 14 120 14 180 0s120-14 180 0 120 14 180 0 120-14 180 0 120 14 180 0 120-14 180 0 120 14 180 0 120-14 180 0"
        fill="none"
        stroke="#5eead4"
        strokeOpacity="0.3"
        strokeWidth="3"
      />
      <path
        d="M0 330c60 12 120 12 180 0s120-12 180 0 120 12 180 0 120-12 180 0 120 12 180 0 120-12 180 0 120 12 180 0 120-12 180 0"
        fill="none"
        stroke="#5eead4"
        strokeOpacity="0.18"
        strokeWidth="3"
      />

      {/* Pier: deck line + support struts running into the sea */}
      <g stroke="#042f2c" strokeWidth="4" strokeLinecap="round">
        <line x1="0" y1="296" x2="560" y2="296" />
        {Array.from({ length: 9 }, (_, i) => 60 + i * 62).map((x) => (
          <line key={x} x1={x} y1="296" x2={x - 22} y2="340" strokeWidth="3" />
        ))}
      </g>

      {/* Tower silhouette, standing on the pier deck */}
      <g fill="none" stroke="#031f1c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M330 296 300 130 260 296" />
        <path d="M280 220h40" />
        <path d="M290 170h20" />
        <line x1="300" y1="130" x2="300" y2="104" />
        <circle cx="300" cy="98" r="5" fill="#031f1c" stroke="none" />
      </g>
    </svg>
  );
}

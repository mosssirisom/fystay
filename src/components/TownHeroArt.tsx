import { cn } from "@/lib/cn";

/**
 * A generated, on-brand coastal scene per town - the same reasoning as
 * HeroBanner.tsx (this codebase's homepage hero): never a hotlinked stock
 * photo, since the app has no real, licensed town photography and a
 * fabricated "photo" of a place would be dishonest in exactly the way this
 * codebase's own seed data and homepage hero already deliberately avoid.
 * Each town gets a distinct, recognisable silhouette (Blackpool Tower and
 * illuminations, Lytham's windmill, Fleetwood's lighthouse, Cleveleys' open
 * coast, Bispham's clifftop) drawn in the same teal/sand palette as the
 * rest of the site so every town's page still reads as one brand.
 */

const SKY_TOP: Record<string, string> = {
  blackpool: "#031f1c",
  "lytham-st-annes": "#0c2b3a",
  cleveleys: "#062a28",
  fleetwood: "#081f2e",
  bispham: "#0a2620",
};

function Sky({ slug }: { slug: string }) {
  const top = SKY_TOP[slug] ?? "#031f1c";
  return (
    <linearGradient id="town-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={top} />
      <stop offset="45%" stopColor="#0f766e" />
      <stop offset="80%" stopColor="#14b8a6" />
      <stop offset="100%" stopColor="#2dd4bf" />
    </linearGradient>
  );
}

function Gulls({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="#f0fdfa" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" fill="none">
      <path d={`M${x} ${y}q14-16 28 0q14-16 28 0`} />
      <path d={`M${x + 70} ${y + 40}q10-11 20 0q10-11 20 0`} />
    </g>
  );
}

function Waves() {
  return (
    <>
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
    </>
  );
}

function BlackpoolScene() {
  const bulbColors = ["#fbbf24", "#f472b6", "#60a5fa", "#34d399"];
  return (
    <>
      {/* Big wheel, further back */}
      <g stroke="#031f1c" strokeOpacity="0.7" strokeWidth="2.5" fill="none">
        <circle cx="1120" cy="230" r="70" />
        <circle cx="1120" cy="230" r="4" fill="#031f1c" fillOpacity="0.7" stroke="none" />
        {Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4).map((a) => (
          <line
            key={a}
            x1={1120}
            y1={230}
            x2={1120 + 70 * Math.cos(a)}
            y2={230 + 70 * Math.sin(a)}
          />
        ))}
      </g>
      {/* Pier deck + struts */}
      <g stroke="#042f2c" strokeWidth="4" strokeLinecap="round">
        <line x1="0" y1="296" x2="560" y2="296" />
        {Array.from({ length: 9 }, (_, i) => 60 + i * 62).map((x) => (
          <line key={x} x1={x} y1="296" x2={x - 22} y2="340" strokeWidth="3" />
        ))}
      </g>
      {/* Tower silhouette */}
      <g fill="none" stroke="#031f1c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M340 296 300 90 260 296" />
        <path d="M275 210h50" />
        <path d="M285 150h30" />
        <line x1="300" y1="90" x2="300" y2="58" />
        <circle cx="300" cy="50" r="6" fill="#031f1c" stroke="none" />
      </g>
      {/* Illumination bulb string along the prom */}
      <path
        d="M0 296q60 30 120 0t120 0 120 0 120 0 120 0 120 0 120 0"
        fill="none"
        stroke="#134e4a"
        strokeOpacity="0.5"
        strokeWidth="2"
      />
      {Array.from({ length: 14 }, (_, i) => i * 90).map((x, i) => (
        <circle key={x} cx={x} cy={296 + 22 * Math.sin((x / 720) * Math.PI * 2)} r="4.5" fill={bulbColors[i % bulbColors.length]} fillOpacity="0.85" />
      ))}
    </>
  );
}

function LythamScene() {
  return (
    <>
      {/* Pier posts, smaller/quieter than Blackpool's */}
      <g stroke="#042f2c" strokeWidth="3" strokeLinecap="round">
        <line x1="1160" y1="296" x2="1440" y2="296" />
        {Array.from({ length: 5 }, (_, i) => 1200 + i * 60).map((x) => (
          <line key={x} x1={x} y1="296" x2={x + 16} y2="330" strokeWidth="2.5" />
        ))}
      </g>
      {/* Windmill on the green */}
      <g stroke="#031f1c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M300 296V150" />
        <path d="M270 296h60" />
        <g strokeWidth="3.5">
          <path d="M300 150l52 18" />
          <path d="M300 150l-18 52" />
          <path d="M300 150l-52-18" />
          <path d="M300 150l18-52" />
        </g>
        <circle cx="300" cy="150" r="5" fill="#031f1c" stroke="none" />
      </g>
      {/* Wide flat green foreground */}
      <rect y="296" width="1440" height="24" fill="#134e4a" fillOpacity="0.45" />
    </>
  );
}

function CleveleysScene() {
  return (
    <>
      {/* Modern promenade shelters - simple angular canopies */}
      {[220, 420, 620].map((x) => (
        <g key={x} stroke="#031f1c" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d={`M${x} 296V250`} />
          <path d={`M${x - 46} 250h92l-14 -22h-64z`} />
        </g>
      ))}
      {/* Open, empty horizon - the point of Cleveleys is the lack of a landmark */}
      <g stroke="#5eead4" strokeOpacity="0.25" strokeWidth="2">
        <line x1="0" y1="300" x2="1440" y2="300" />
      </g>
      {/* Dune grass tufts */}
      <g stroke="#134e4a" strokeWidth="2.5" strokeLinecap="round" fill="none">
        {[900, 950, 1000, 1180, 1230].map((x) => (
          <g key={x}>
            <path d={`M${x} 318q-6-14 0-22`} />
            <path d={`M${x + 8} 318q2-16 10-22`} />
            <path d={`M${x + 16} 318q10-10 8-20`} />
          </g>
        ))}
      </g>
    </>
  );
}

function FleetwoodScene() {
  return (
    <>
      {/* Boat masts near the dock */}
      <g stroke="#042f2c" strokeWidth="2.5" strokeLinecap="round">
        {[980, 1040, 1100].map((x, i) => (
          <line key={x} x1={x} y1="296" x2={x} y2={296 - 60 - i * 10} />
        ))}
      </g>
      {/* Lighthouse */}
      <g fill="none" stroke="#031f1c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M280 296V140" />
        <path d="M270 296h20" />
        <path d="M264 150h32" />
        <path d="M270 140h20" />
        <rect x="271" y="105" width="18" height="20" fill="#031f1c" stroke="none" />
      </g>
      {/* Lighthouse beam */}
      <path d="M300 112 L 460 60 L 460 90 Z" fill="#fef3c7" fillOpacity="0.22" />
      {/* Dock line */}
      <line x1="900" y1="296" x2="1440" y2="296" stroke="#042f2c" strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

function BisphamScene() {
  return (
    <>
      {/* Cliff edge silhouette rising toward the right */}
      <path d="M0 320 L 500 320 L 620 250 L 900 250 L 1440 250 L 1440 420 L 0 420 Z" fill="#042f2c" fillOpacity="0.55" />
      {/* Garden shrubs along the clifftop */}
      <g fill="#134e4a" fillOpacity="0.7">
        {[660, 720, 780, 840].map((x) => (
          <ellipse key={x} cx={x} cy="244" rx="22" ry="14" />
        ))}
      </g>
      {/* A single bench, looking out */}
      <g stroke="#031f1c" strokeWidth="3" strokeLinecap="round">
        <line x1="960" y1="248" x2="960" y2="264" />
        <line x1="1000" y1="248" x2="1000" y2="264" />
        <line x1="955" y1="248" x2="1005" y2="248" />
        <line x1="955" y1="234" x2="1005" y2="234" />
      </g>
    </>
  );
}

const SCENES: Record<string, () => React.ReactNode> = {
  blackpool: BlackpoolScene,
  "lytham-st-annes": LythamScene,
  cleveleys: CleveleysScene,
  fleetwood: FleetwoodScene,
  bispham: BisphamScene,
};

export function TownHeroArt({ slug, className }: { slug: string; className?: string }) {
  const Scene = SCENES[slug] ?? BlackpoolScene;

  return (
    <svg
      viewBox="0 0 1440 420"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      className={cn("overflow-hidden", className)}
      aria-hidden
    >
      <defs>
        <Sky slug={slug} />
        <radialGradient id="town-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="town-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#115e59" />
          <stop offset="100%" stopColor="#042f2c" />
        </linearGradient>
        <linearGradient id="town-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#134e4a" />
          <stop offset="100%" stopColor="#042f2c" />
        </linearGradient>
      </defs>

      <rect width="1440" height="420" fill="url(#town-sky)" />
      <circle cx="180" cy="120" r="130" fill="url(#town-sun)" />
      <circle cx="180" cy="120" r="40" fill="#fef3c7" fillOpacity="0.9" />

      <g fill="#f0fdfa" fillOpacity="0.14">
        <ellipse cx="620" cy="80" rx="100" ry="26" />
        <ellipse cx="720" cy="65" rx="60" ry="18" />
        <ellipse cx="1220" cy="70" rx="110" ry="24" />
      </g>

      <Gulls x={520} y={130} />

      <rect y="300" width="1440" height="120" fill="url(#town-sea)" />
      <Waves />

      <rect y="392" width="1440" height="28" fill="url(#town-sand)" />

      <Scene />
    </svg>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { FyldeCoastDestination } from "@/lib/destinations";
import type { TownHeroContent } from "@/lib/townHero";
import type { TownWeather } from "@/lib/localData/weather";
import { TownHeroArt } from "@/components/TownHeroArt";
import { WeatherIcon } from "@/components/WeatherIcon";
import { Badge } from "@/components/ui/Badge";

/**
 * The premium concierge's front door: full-bleed real photography (or
 * generated town art where no photo exists yet), the town's name, a short
 * editorial line, two honest "Perfect for" tags, current weather when it's
 * available, and one simple CTA into the rest of the page. Deliberately
 * light on text - the brief's "do not overwhelm users with information"
 * starts right here, at the very top of the page, so the photo itself stays
 * the thing a visitor actually looks at rather than a wall of copy over it.
 * Only the first two of TOWN_HERO_CONTENT's four "perfectFor" tags are
 * shown - the full set still exists (worth keeping for anything else that
 * wants to draw on them later), it's just more than a hero needs at once.
 */
export function TownHero({
  destination,
  hero,
  weather,
  exploreHref,
}: {
  destination: FyldeCoastDestination;
  hero: TownHeroContent;
  weather: TownWeather | null;
  exploreHref: string;
}) {
  return (
    <section className="relative -mx-6 h-[380px] w-[calc(100%+3rem)] overflow-hidden sm:h-[440px] lg:h-[480px]">
      <div className="absolute inset-0">
        <TownHeroArt slug={destination.slug} className="h-full w-full" />
      </div>
      {/* A gentle bottom-weighted scrim so the white text stays readable over the art regardless of where it lands. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-end px-6 pb-8 sm:pb-10">
        {weather && (
          <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <WeatherIcon icon={weather.current.condition.icon} className="h-3.5 w-3.5" />
            {weather.current.temperatureC}°C · {weather.current.condition.label}
          </div>
        )}

        <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{destination.name}</h1>
        <p className="mt-2 line-clamp-2 max-w-md text-sm leading-snug text-white/90 sm:text-base">{hero.intro}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {hero.perfectFor.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="neutral" className="border border-white/25 bg-white/10 text-white">
              {tag}
            </Badge>
          ))}
        </div>

        <Link
          href={exploreHref}
          className="focus-ring mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
        >
          Explore {destination.name}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

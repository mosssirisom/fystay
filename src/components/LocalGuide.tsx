import { ChevronDown, Compass, Quote, Sparkles } from "lucide-react";
import { GUIDE_CATEGORIES, LOCAL_GUIDES } from "@/lib/localGuide";
import type { FyldeCoastDestination } from "@/lib/destinations";
import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/Badge";

/**
 * The FYStay Local Guide - the thing neither Airbnb nor Booking.com give a
 * guest: a full, opinionated brief on the town itself, not just the four
 * walls being booked. Built as native <details>/<summary> rather than a
 * client-side accordion, so every category's content sits in the page's
 * HTML whether or not it's expanded - a search engine or an AI crawler
 * reads the whole guide, not just whatever's open on load, and none of it
 * needs JavaScript to work.
 */
export function LocalGuide({ destination }: { destination: FyldeCoastDestination }) {
  const guide = LOCAL_GUIDES[destination.slug];
  if (!guide) return null;

  return (
    <section id="local-guide" className="mt-14 scroll-mt-20 border-t border-border-subtle pt-10">
      <Badge variant="brand">
        <Sparkles className="h-3 w-3" aria-hidden />
        Only on FYStay
      </Badge>
      <div className="mt-3">
        <SectionHeading icon={Compass}>{destination.name} Local Guide</SectionHeading>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
        Everything you need for a trip to {destination.name} in one place - written by people who
        actually know this stretch of coast, not scraped from a review site.
      </p>

      <blockquote className="mt-6 flex gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-5">
        <Quote className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
        <p className="text-sm italic leading-relaxed text-brand-900">{guide.insiderTip}</p>
      </blockquote>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {GUIDE_CATEGORIES.map(({ key, label, icon: Icon }) => {
          const entries = guide[key];
          if (entries.length === 0) return null;
          return (
            <details
              key={key}
              className="group rounded-2xl border border-border-subtle bg-surface p-5 open:shadow-[var(--shadow-card)]"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 marker:content-none">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="font-semibold text-foreground">{label}</span>
                <ChevronDown
                  className="ml-auto h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <ul className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4">
                {entries.map((entry) => (
                  <li key={entry.name}>
                    <p className="text-sm font-medium text-foreground">{entry.name}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">{entry.note}</p>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </section>
  );
}

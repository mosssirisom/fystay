import { Lightbulb } from "lucide-react";
import { LOCAL_KNOWLEDGE, LOCAL_KNOWLEDGE_CATEGORIES } from "@/lib/localKnowledge";

/**
 * FYStay Local Knowledge - the specific, practical answers a guest would
 * otherwise have to piece together from a search engine (which car park to
 * avoid, when to actually turn up, where to go instead of the obvious
 * choice). Deliberately laid out as a single editorial list rather than
 * another expandable accordion grid: this section is short enough to read
 * in full, and showing it straight away - headline first, like a proper
 * piece of advice rather than a hidden answer - is what makes it read as
 * edited content rather than a repeat of the Local Guide's reference-style
 * category grid below it.
 */
export function LocalKnowledge({ destinationName, slug }: { destinationName: string; slug: string }) {
  const knowledge = LOCAL_KNOWLEDGE[slug];
  if (!knowledge) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Lightbulb className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-lg font-semibold text-foreground">FYStay Local Knowledge</p>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
        The stuff regulars know that doesn&apos;t show up in a search engine - parking to avoid, when to
        actually turn up, and where to go instead of the obvious choice in {destinationName}.
      </p>

      <ul className="mt-5 divide-y divide-border-subtle rounded-3xl border border-border-subtle bg-surface px-6 sm:px-8">
        {LOCAL_KNOWLEDGE_CATEGORIES.map(({ key, label, icon: Icon }) => {
          const entry = knowledge[key];
          return (
            <li key={key} className="py-5 first:pt-6 last:pb-6">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {label}
              </div>
              <p className="mt-1.5 font-semibold text-foreground">{entry.headline}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">{entry.body}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

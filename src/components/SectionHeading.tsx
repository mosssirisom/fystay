import type { LucideIcon } from "lucide-react";

/**
 * The small icon-badge + heading pairing used across the listing detail
 * page's content sections (About, Amenities, Getting around, Cancellation
 * policy, Reviews) - the same "icon in a soft brand circle" language the
 * homepage's "Why FYStay" cards use, so a guest sees one consistent visual
 * vocabulary for "here's a labelled block of information" across the site
 * rather than a plain-text heading here and an icon badge there.
 */
export function SectionHeading({
  icon: Icon,
  children,
  id,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h2 id={id} className={id ? "scroll-mt-20 flex items-center gap-2.5" : "flex items-center gap-2.5"}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-lg font-semibold text-foreground">{children}</span>
    </h2>
  );
}

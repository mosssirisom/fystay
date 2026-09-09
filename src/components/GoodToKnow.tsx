import { ArrowRight, ShieldCheck, type LucideIcon } from "lucide-react";

export type GoodToKnowRow = {
  icon: LucideIcon;
  label: string;
  value: string;
};

/**
 * Only the facts this schema actually records: maximum guests always (a
 * real column on every listing), parking/pets only when the host's own
 * amenity list says so. No check-in window, minimum stay, or smoking/
 * children policy - none of that is data this app collects yet, and a
 * guessed "From 3:00 PM" would be worse than not showing a check-in row at
 * all. Cancellation policy links to the full section already on this page
 * rather than repeating its text here.
 */
export function GoodToKnow({ rows }: { rows: GoodToKnowRow[] }) {
  return (
    <div className="mt-3 flex flex-col divide-y divide-border-subtle rounded-2xl border border-border-subtle">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3 px-4 py-3.5">
          <Icon className="h-4.5 w-4.5 shrink-0 text-brand-600" aria-hidden />
          <span className="text-sm text-zinc-500">{label}</span>
          <span className="ml-auto text-sm font-medium text-foreground">{value}</span>
        </div>
      ))}
      <a
        href="#cancellation-policy"
        className="focus-ring flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-brand-700 hover:bg-surface-muted"
      >
        <ShieldCheck className="h-4.5 w-4.5 shrink-0" aria-hidden />
        Cancellation policy
        <ArrowRight className="ml-auto h-4 w-4 shrink-0" aria-hidden />
      </a>
    </div>
  );
}

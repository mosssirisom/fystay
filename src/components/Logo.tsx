import { cn } from "@/lib/cn";

const sizeClasses = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-5xl",
};

export function Logo({
  size = "md",
  withTagline = false,
  taglineClassName,
  className,
}: {
  size?: keyof typeof sizeClasses;
  withTagline?: boolean;
  /** Overrides the tagline's own size/spacing - the default (text-sm) suits
   * the footer's roomier logo block, but a sticky navbar shown on every
   * page needs it noticeably smaller so the header doesn't grow taller
   * site-wide. */
  taglineClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span
        className={cn("font-[family-name:var(--font-logo)] leading-none", sizeClasses[size])}
      >
        <span className="text-brand-600">FY</span>
        <span className="text-[var(--color-ink)]">Stay</span>
      </span>
      {withTagline && (
        <span
          className={cn("mt-1.5 font-[family-name:var(--font-logo)] text-sm", taglineClassName)}
        >
          <span className="text-brand-700">Your stay,</span>{" "}
          <span className="text-[var(--color-ink)]">your way</span>
        </span>
      )}
    </span>
  );
}

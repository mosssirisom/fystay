"use client";

import { cn } from "@/lib/cn";
import { useNavTone } from "@/components/NavTone";

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
  const tone = useNavTone();
  const isHero = tone === "hero";

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span
        className={cn(
          // tracking-tight pulls DM Serif Display's fairly generous default
          // spacing in so "FY" and "Stay" read as one fused wordmark rather
          // than two adjacent words - font-normal guards against the
          // browser synthesizing a bolder weight than the single 400 the
          // font actually ships.
          "font-[family-name:var(--font-logo)] font-normal leading-none tracking-tight",
          sizeClasses[size],
        )}
      >
        <span className="text-brand-600">FY</span>
        <span className={cn("text-[var(--color-ink)]", isHero && "text-white")}>Stay</span>
      </span>
      {withTagline && (
        <span
          className={cn(
            // Sized to match the "FYStay" wordmark's own rendered width at
            // this component's "sm" size (the only size any caller
            // currently pairs with a tagline) - "Your stay, your way" is
            // roughly 3x the character count of "FYStay", so fitting it
            // into the same width needs a font size this much smaller, not
            // just a token step down like text-sm/text-xs.
            "mt-1.5 font-[family-name:var(--font-logo)] text-[7px] uppercase tracking-wide",
            taglineClassName,
          )}
        >
          <span className={cn("text-brand-700", isHero && "text-brand-300")}>Your stay,</span>{" "}
          <span className={cn("text-[var(--color-ink)]", isHero && "text-white/90")}>your way</span>
        </span>
      )}
    </span>
  );
}

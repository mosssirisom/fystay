import { cn } from "@/lib/cn";

const sizeClasses = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-5xl",
};

export function Logo({
  size = "md",
  withTagline = false,
  className,
}: {
  size?: keyof typeof sizeClasses;
  withTagline?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span
        className={cn("font-[family-name:var(--font-logo)] leading-none", sizeClasses[size])}
      >
        <span className="text-brand-600">FY</span>
        <span className="text-[var(--color-ink)]">stay</span>
      </span>
      {withTagline && (
        <span className="mt-1.5 font-[family-name:var(--font-logo)] text-sm">
          <span className="text-brand-700">stay local.</span>{" "}
          <span className="text-[var(--color-ink)]">stay fylde.</span>
        </span>
      )}
    </span>
  );
}

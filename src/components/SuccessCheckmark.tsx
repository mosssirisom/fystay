import { cn } from "@/lib/cn";

/**
 * A checkmark that draws itself on top of a scale "pop" - see the
 * success-pop/success-draw keyframes in globals.css, including their
 * @media (prefers-reduced-motion) override, which is what turns this off
 * (rather than any JS check here) by forcing the animation to `none` and
 * the stroke straight to its finished state.
 */
export function SuccessCheckmark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden
      className={cn("animate-success-pop", className)}
    >
      <circle
        cx="36"
        cy="36"
        r="33"
        stroke="currentColor"
        strokeWidth="4"
        className="animate-success-circle text-brand-600"
      />
      <path
        d="M22 37 L31 46 L50 25"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-success-check text-brand-700"
      />
    </svg>
  );
}

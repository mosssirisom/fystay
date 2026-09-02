import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            // text-base below sm: see Input.tsx - prevents iOS Safari's
            // auto-zoom-on-focus for any field with a computed font-size
            // under 16px.
            "focus-ring h-10 w-full appearance-none rounded-lg border border-border-subtle bg-surface px-3 pr-9 text-base text-foreground sm:text-sm",
            "transition-colors hover:border-zinc-300",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
      </div>
    );
  },
);
Select.displayName = "Select";

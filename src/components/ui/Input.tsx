import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "focus-ring h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground placeholder:text-zinc-400",
          "transition-colors hover:border-zinc-300",
          invalid && "border-red-400 focus-visible:outline-red-500",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

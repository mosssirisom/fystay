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
          // text-base (16px) below sm: iOS Safari auto-zooms the page on
          // focus for any input with a computed font-size under 16px - sm+
          // reverts to the original text-sm since that's a mouse/trackpad
          // context where zoom-on-focus doesn't happen.
          "focus-ring h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-base text-foreground placeholder:text-zinc-500 sm:text-sm",
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

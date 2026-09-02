import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          // text-base below sm: see Input.tsx - prevents iOS Safari's
          // auto-zoom-on-focus for any field with a computed font-size
          // under 16px.
          "focus-ring w-full resize-y rounded-lg border border-border-subtle bg-surface px-3 py-2 text-base text-foreground placeholder:text-zinc-500 sm:text-sm",
          "transition-colors hover:border-zinc-300",
          invalid && "border-red-400 focus-visible:outline-red-500",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

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
          "focus-ring w-full resize-y rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground placeholder:text-zinc-500",
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

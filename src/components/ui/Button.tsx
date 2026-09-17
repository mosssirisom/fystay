import { forwardRef } from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // shadow-sm -> hover:shadow-md on the two solid, filled-color
        // variants only (the ones that read as a real physical button) -
        // a small lift on top of the existing color-darken, not a
        // transform/scale, so it stays a tactile confirmation rather than
        // a bouncy effect. The quieter variants (secondary/outline/ghost)
        // keep a flat color-only hover, matching their own "quiet control"
        // role - giving every variant the same shadow lift would flatten
        // that intentional hierarchy between "the button" and "an option".
        primary: "bg-brand-700 text-white shadow-sm hover:bg-brand-800 hover:shadow-md active:bg-brand-900 active:shadow-sm",
        secondary:
          "bg-surface-muted text-foreground hover:bg-border-subtle active:bg-border-subtle",
        outline:
          "border border-border-subtle bg-transparent text-foreground hover:bg-surface-muted active:bg-border-subtle",
        ghost: "bg-transparent text-foreground hover:bg-surface-muted active:bg-border-subtle",
        danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md active:bg-red-800 active:shadow-sm",
        link: "rounded-none bg-transparent p-0 text-brand-700 underline-offset-4 hover:underline active:text-brand-900",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

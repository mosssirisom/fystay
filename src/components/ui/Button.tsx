import { forwardRef } from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900",
        secondary:
          "bg-surface-muted text-foreground hover:bg-border-subtle active:bg-border-subtle",
        outline:
          "border border-border-subtle bg-transparent text-foreground hover:bg-surface-muted",
        ghost: "bg-transparent text-foreground hover:bg-surface-muted",
        danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        link: "rounded-none bg-transparent p-0 text-brand-700 underline-offset-4 hover:underline",
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

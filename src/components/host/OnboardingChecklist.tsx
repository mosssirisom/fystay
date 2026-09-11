import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type OnboardingStep = {
  key: string;
  label: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
  optional?: boolean;
};

/**
 * Shown until every required step is done, then disappears for good - a
 * fully set-up host never sees this again. Each step's `done` state comes
 * from real account data (Stripe Connect status, listing count, identity
 * verification), never a fabricated progress value.
 */
export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const requiredSteps = steps.filter((step) => !step.optional);
  if (requiredSteps.every((step) => step.done)) return null;

  const doneCount = requiredSteps.filter((step) => step.done).length;

  return (
    <Card className="mt-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-foreground">Finish setting up your hosting account</h2>
        <span className="text-sm text-zinc-500">
          {doneCount} of {requiredSteps.length} done
        </span>
      </div>
      <ul className="mt-4 flex flex-col gap-4">
        {steps.map((step) => (
          <li key={step.key} className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            {step.done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-zinc-300" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.done ? "text-zinc-500 line-through" : "text-foreground",
                )}
              >
                {step.label}
                {step.optional && !step.done ? " (optional)" : ""}
              </p>
              <p className="text-xs text-zinc-500">{step.description}</p>
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shrink-0")}
              >
                {step.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, Home, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact us",
  description: "How to reach FYStay for booking questions, safety concerns, or hosting support.",
};

const REASONS = [
  {
    icon: HelpCircle,
    title: "Booking or account questions",
    description: "Anything about searching, booking, payments, or your account.",
  },
  {
    icon: ShieldAlert,
    title: "Report a safety concern",
    description:
      "A listing, review, or message that doesn't seem right - see our Safety information page for more on how reports are handled.",
  },
  {
    icon: Home,
    title: "Hosting support",
    description: "Questions about listing a property, payouts, or your host dashboard.",
  },
];

const SUPPORT_EMAIL = "support@fystay.co.uk";

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Contact us</h1>
      <p className="mt-2 text-sm text-zinc-500">
        FYStay is a small, Fylde Coast-focused team - every message reaches a real person, not a
        queue.
      </p>

      <div className="mt-8 flex flex-col divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
        {REASONS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start gap-3 px-5 py-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border-subtle bg-brand-50 px-5 py-5 text-center">
        <p className="text-sm text-zinc-600">Email us directly and we&apos;ll get back to you</p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-1 inline-block text-lg font-semibold text-brand-800 underline underline-offset-2 hover:text-brand-900"
        >
          {SUPPORT_EMAIL}
        </a>
      </div>

      <p className="mt-8 text-sm text-zinc-500">
        For common questions you can also check the{" "}
        <Link href="/help" className="text-brand-700 underline underline-offset-2 hover:text-brand-800">
          Help center
        </Link>{" "}
        or{" "}
        <Link href="/safety" className="text-brand-700 underline underline-offset-2 hover:text-brand-800">
          Safety information
        </Link>
        .
      </p>
    </div>
  );
}

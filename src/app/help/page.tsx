import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help center",
  description: "Answers to common questions about booking, hosting and managing your account on FYstay.",
};

const FAQS: { question: string; answer: React.ReactNode }[] = [
  {
    question: "How do I book a stay?",
    answer:
      "Search for a destination or hotel on the homepage, pick your dates and guest count, then choose a listing and press Book. You'll see the full price breakdown before you pay securely through Stripe.",
  },
  {
    question: "How do I cancel or change a booking?",
    answer: (
      <>
        Go to <Link href="/bookings" className="text-brand-700 underline-offset-2 hover:underline">My Trips</Link>,
        open the booking, and choose to cancel or request a date change. Any refund is calculated
        automatically from the listing&apos;s cancellation policy - see{" "}
        <Link href="/cancellation-policies" className="text-brand-700 underline-offset-2 hover:underline">
          Cancellation Policies
        </Link>{" "}
        for details.
      </>
    ),
  },
  {
    question: "How do payments and refunds work?",
    answer:
      "All payments and refunds are processed by Stripe. A confirmed refund is returned to your original payment method - Stripe's own processing times apply, typically 5-10 business days.",
  },
  {
    question: "How do I contact a host?",
    answer:
      "Once you have a confirmed booking, the host's contact details are shown on your booking's detail page so you can coordinate check-in.",
  },
  {
    question: "How do I list my property?",
    answer: (
      <>
        Create a host account (or switch your existing account to hosting from{" "}
        <Link href="/register" className="text-brand-700 underline-offset-2 hover:underline">
          sign up
        </Link>
        ), then add your first listing from the host dashboard. See our{" "}
        <Link href="/host-guide" className="text-brand-700 underline-offset-2 hover:underline">
          Host guide
        </Link>{" "}
        for a full walkthrough.
      </>
    ),
  },
  {
    question: "I forgot my password - what do I do?",
    answer: (
      <>
        Use{" "}
        <Link href="/forgot-password" className="text-brand-700 underline-offset-2 hover:underline">
          Forgot password
        </Link>{" "}
        on the login page to get a secure reset link sent to your email.
      </>
    ),
  },
  {
    question: "How are reviews verified?",
    answer:
      "Only a guest who has completed a paid stay at a listing can leave a review for it, so every review reflects a genuine stay.",
  },
];

export default function HelpCenterPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Help center</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Answers to common questions about booking, hosting, and managing your account.
      </p>

      <div className="mt-8 flex flex-col divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
        {FAQS.map(({ question, answer }) => (
          <details key={question} className="group px-5 py-4 open:pb-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-foreground marker:content-none">
              {question}
            </summary>
            <div className="mt-2 text-sm leading-relaxed text-zinc-600">{answer}</div>
          </details>
        ))}
      </div>

      <p className="mt-8 text-sm text-zinc-500">
        Can&apos;t find what you&apos;re looking for? Email us at{" "}
        <a href="mailto:support@fystay.co.uk" className="text-brand-700 underline-offset-2 hover:underline">
          support@fystay.co.uk
        </a>
        .
      </p>
    </div>
  );
}

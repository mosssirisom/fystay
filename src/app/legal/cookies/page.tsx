import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Cookie Policy" };

const LAST_UPDATED = "31 August 2026";

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection heading="What we actually use">
        <p>
          FY Stay keeps cookies to a minimum. We only use cookies that are strictly necessary to
          run the site - we don&apos;t use any analytics, advertising, or third-party tracking
          cookies today.
        </p>
        {/* This table's three columns (one holding full sentences) don't fit
            a phone width without either scrolling or squeezing every cell
            into an unreadable wrap - overflow-x-auto on the wrapper keeps
            the table's own layout intact and lets a phone swipe sideways
            instead. */}
        <div className="mt-2 overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-surface-muted">
                <th className="border-b border-border-subtle px-3 py-2 font-semibold text-foreground">Cookie</th>
                <th className="border-b border-border-subtle px-3 py-2 font-semibold text-foreground">Purpose</th>
                <th className="border-b border-border-subtle px-3 py-2 font-semibold text-foreground">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-border-subtle px-3 py-2 align-top">Session cookie</td>
                <td className="border-b border-border-subtle px-3 py-2 align-top">
                  Keeps you signed in to your account. Strictly necessary - the site can&apos;t
                  function without it once you&apos;ve logged in.
                </td>
                <td className="border-b border-border-subtle px-3 py-2 align-top">Until you log out, or expires automatically</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Cookie notice preference</td>
                <td className="px-3 py-2 align-top">
                  Remembers that you&apos;ve seen and dismissed the cookie notice, so it doesn&apos;t
                  show again on your next visit.
                </td>
                <td className="px-3 py-2 align-top">Stored on your device until cleared</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection heading="Payment">
        <p>
          When you check out, you&apos;re briefly taken to Stripe&apos;s own secure checkout page.
          Stripe may set its own cookies while you&apos;re on their domain, governed by{" "}
          <a
            href="https://stripe.com/gb/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-brand-700 underline-offset-2 hover:underline"
          >
            Stripe&apos;s own privacy and cookie policy
          </a>
          , not this one.
        </p>
      </LegalSection>

      <LegalSection heading="Why there's no cookie preference toggle">
        <p>
          UK rules on cookies (PECR) only require your consent for non-essential cookies, such as
          analytics or advertising. Since FY Stay doesn&apos;t use any of those, there&apos;s
          nothing non-essential to ask your permission for - the notice you see is purely
          informational. If that ever changes (for example, if we add analytics in future),
          we&apos;ll update this page and add a proper consent choice before we do.
        </p>
        <p>
          See our{" "}
          <Link href="/legal/privacy" className="text-brand-700 underline-offset-2 hover:underline">
            Privacy Policy
          </Link>{" "}
          for how we handle personal data more broadly.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

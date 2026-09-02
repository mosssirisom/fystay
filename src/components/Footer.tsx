import Link from "next/link";

const columns = [
  {
    heading: "Support",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Safety information", href: "/safety" },
      { label: "Cancellation options", href: "/cancellation-policies" },
    ],
  },
  {
    heading: "Hosting",
    links: [
      { label: "Host your home", href: "/host" },
      { label: "Host dashboard", href: "/host/dashboard" },
      { label: "Hosting resources", href: "/host-guide" },
    ],
  },
  {
    heading: "Company",
    links: [{ label: "About", href: "/about" }],
  },
];

const legalLinks = [
  { label: "Terms and Conditions", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Cookie Policy", href: "/legal/cookies" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface-muted">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-3">
        {columns.map((col) => (
          <div key={col.heading}>
            <p className="text-sm font-semibold text-foreground">{col.heading}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 hover:text-brand-700 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border-subtle px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">© {new Date().getFullYear()} FYstay</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-xs text-zinc-500 hover:text-brand-700 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

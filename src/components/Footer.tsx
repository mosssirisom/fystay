import Link from "next/link";

const columns = [
  {
    heading: "Support",
    links: [
      { label: "Help center", href: "#" },
      { label: "Safety information", href: "#" },
      { label: "Cancellation options", href: "#" },
    ],
  },
  {
    heading: "Hosting",
    links: [
      { label: "Host your home", href: "/register" },
      { label: "Host dashboard", href: "/host/dashboard" },
      { label: "Hosting resources", href: "#" },
    ],
  },
  {
    heading: "fystay",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Newsroom", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface-muted">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-3">
        {columns.map((col) => (
          <div key={col.heading}>
            <h2 className="text-sm font-semibold text-foreground">{col.heading}</h2>
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
        <p className="mx-auto max-w-6xl text-xs text-zinc-500">
          © {new Date().getFullYear()} fystay, Inc.
        </p>
      </div>
    </footer>
  );
}

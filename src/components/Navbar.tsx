import Link from "next/link";
import { Home } from "lucide-react";
import { auth } from "@/auth";
import { UserMenu } from "@/components/UserMenu";
import { GuestMenu } from "@/components/GuestMenu";
import { Logo } from "@/components/Logo";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-white/90 backdrop-blur">
      {/* relative + an absolutely-positioned centering layer, rather than a
          grid with an empty balancing column: a grid track sized to "the
          rest of the space" still has to yield to its content's minimum
          width, so an empty left column and the (non-empty) nav's column
          end up different sizes and the logo lands off-center by roughly
          half that difference. Centering the logo against the *whole*
          header width via this overlay, independent of however wide the
          signed-in/signed-out nav controls happen to be, keeps it exactly
          centered regardless. pointer-events-none/auto so the transparent
          overlay never blocks clicks on the icon or the nav on either
          side of it. */}
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link
          href="/"
          aria-label="FYStay home"
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white"
        >
          <Home className="h-5 w-5" strokeWidth={2.5} />
        </Link>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Link href="/" className="pointer-events-auto flex items-center gap-2">
            <Logo size="sm" withTagline taglineClassName="mt-0 text-[10px] leading-tight" />
          </Link>
        </div>

        <nav className="relative z-10 flex items-center gap-3">
          {session?.user ? (
            <UserMenu name={session.user.name ?? "Account"} role={session.user.role} />
          ) : (
            <GuestMenu />
          )}
        </nav>
      </div>
    </header>
  );
}

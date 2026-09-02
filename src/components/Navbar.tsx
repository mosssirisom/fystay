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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Home className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <Logo size="sm" withTagline taglineClassName="mt-0 text-[10px] leading-tight" />
        </Link>

        <nav className="flex items-center gap-3">
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

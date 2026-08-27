import Link from "next/link";
import { Home } from "lucide-react";
import { auth } from "@/auth";
import { UserMenu } from "@/components/UserMenu";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-brand-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Home className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          fystay
        </Link>

        <nav className="flex items-center gap-3">
          {session?.user ? (
            <UserMenu name={session.user.name ?? "Account"} role={session.user.role} />
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium text-zinc-700 hover:text-brand-700"
              >
                Log in
              </Link>
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

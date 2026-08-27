import Link from "next/link";
import { auth } from "@/auth";
import { UserMenu } from "@/components/UserMenu";
import { Logo } from "@/components/Logo";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center">
          <Logo size="sm" />
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

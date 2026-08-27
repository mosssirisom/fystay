import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-rose-600">
          fystay
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          {session?.user ? (
            <>
              {session.user.role === "HOST" && (
                <Link href="/host/dashboard" className="text-zinc-700 hover:text-rose-600">
                  Host dashboard
                </Link>
              )}
              <Link href="/bookings" className="text-zinc-700 hover:text-rose-600">
                My trips
              </Link>
              <span className="text-zinc-500">Hi, {session.user.name}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-full border border-zinc-300 px-4 py-1.5 hover:bg-zinc-100"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-700 hover:text-rose-600">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-rose-600 px-4 py-1.5 text-white hover:bg-rose-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

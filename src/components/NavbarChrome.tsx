"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NavToneContext } from "@/components/NavTone";

/**
 * Owns the one piece of the navbar that has to know the current route: the
 * homepage's video hero wants the bar transparent and overlaid on the
 * footage (desktop only - see page.tsx's hero section), every other page
 * wants the normal opaque, sticky bar this site has always had. Splitting
 * this out into its own client component - rather than making the whole
 * (server, session-fetching) Navbar a client component - keeps that data
 * fetch on the server while still letting the chrome react to the route.
 */
export function NavbarChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <NavToneContext.Provider value={isHome ? "hero" : "default"}>
      <header
        className={cn(
          "sticky top-0 z-30 border-b border-border-subtle bg-surface/90 backdrop-blur",
          // lg: on the homepage this drops out of "sticky, opaque, its own
          // height" into "static, transparent, a fixed height with a
          // matching negative margin pulled onto the hero section right
          // after it" (see that section's lg:-mt-20 in page.tsx) - a
          // negative-margin overlap rather than position:absolute, so this
          // still renders in normal document flow right after whatever the
          // cookie consent banner (a sibling, in-flow block above this)
          // currently occupies, instead of pinning to the literal top of
          // the page and overlapping the banner when it's showing.
          isHome && "lg:static lg:z-40 lg:border-none lg:bg-transparent lg:shadow-none lg:backdrop-blur-none",
        )}
      >
        {children}
      </header>
    </NavToneContext.Provider>
  );
}

"use client";

import { createContext, useContext } from "react";

/**
 * "hero" means the navbar is currently overlaid transparently on the
 * homepage's video hero (desktop only - see NavbarChrome) and its children
 * (Logo, GuestMenu, UserMenu) need light/white styling at that breakpoint
 * to stay legible over the footage. Everywhere else - every other page,
 * and the homepage itself below lg: - the default context value applies
 * and nothing changes from today's look.
 */
export type NavTone = "default" | "hero";

export const NavToneContext = createContext<NavTone>("default");

export function useNavTone(): NavTone {
  return useContext(NavToneContext);
}

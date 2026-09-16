"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleUserRound, Home, Menu } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A single trigger that opens a dropdown with Log in / Sign up, replacing
 * two separate top-right links - one control reads as calmer and more
 * considered than a permanently-visible pair of competing CTAs.
 */
export function GuestMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="guest-menu-panel"
        aria-label="Account menu"
        className="focus-ring flex items-center gap-2 rounded-xl bg-brand-600 py-2 pl-3 pr-1.5 text-white hover:bg-brand-700 active:bg-brand-800"
      >
        <Menu className="h-4 w-4" />
        <CircleUserRound className="h-7 w-7 text-white/90" strokeWidth={1.5} />
      </button>

      <div
        ref={menuRef}
        id="guest-menu-panel"
        className={cn(
          "absolute right-0 z-20 mt-2 w-52 origin-top-right overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[var(--shadow-popover)]",
          "transition-all duration-150",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
        )}
      >
        {/* Same brand-terracotta-to-amber gradient already used as the
            decorative top bar on BookingWidget/CheckoutForm - a thin
            accent here ties this menu into that same visual language
            instead of reading as a plain, unbranded system dropdown. */}
        <div
          className="h-1 w-full bg-gradient-to-r from-brand-600 via-brand-400 to-accent-400"
          aria-hidden
        />
        <div className="p-1.5">
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-800"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm text-stone-700 hover:bg-brand-50"
          >
            Log in
          </Link>
          <div className="my-1 border-t border-border-subtle" />
          <Link
            href="/host"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            <Home className="h-4 w-4" aria-hidden />
            List your property
          </Link>
        </div>
      </div>
    </div>
  );
}

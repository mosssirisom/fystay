"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleUserRound, Home, Menu } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A single Airbnb-style pill that opens a dropdown with Log in / Sign up,
 * replacing two separate top-right links - one trigger reads as calmer and
 * more premium than a permanently-visible pair of competing CTAs.
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
        className="focus-ring flex items-center gap-2 rounded-full border border-border-subtle py-2 pl-3 pr-1.5 text-zinc-600 hover:shadow-[var(--shadow-card)]"
      >
        <Menu className="h-4 w-4" />
        <CircleUserRound className="h-7 w-7 text-zinc-400" strokeWidth={1.5} />
      </button>

      <div
        ref={menuRef}
        id="guest-menu-panel"
        className={cn(
          "absolute right-0 z-20 mt-2 w-52 origin-top-right overflow-hidden rounded-xl border border-border-subtle bg-surface p-1.5 shadow-[var(--shadow-popover)]",
          "transition-all duration-150",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <Link
          href="/register"
          onClick={() => setOpen(false)}
          className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className="block rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-surface-muted"
        >
          Log in
        </Link>
        <div className="my-1 border-t border-border-subtle" />
        <Link
          href="/host"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-surface-muted"
        >
          <Home className="h-4 w-4" aria-hidden />
          List your property
        </Link>
      </div>
    </div>
  );
}

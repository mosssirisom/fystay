"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, LayoutDashboard, LogOut, Luggage } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/cn";

type Props = {
  name: string;
  role: "GUEST" | "HOST" | "ADMIN";
};

export function UserMenu({ name, role }: Props) {
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
      menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="user-menu-panel"
        className="focus-ring flex items-center gap-2 rounded-full border border-border-subtle py-1 pl-3 pr-1 hover:shadow-[var(--shadow-card)]"
      >
        <span className="hidden text-sm font-medium sm:inline">{name.split(" ")[0]}</span>
        <Avatar name={name} size={32} />
      </button>

      <div
        ref={menuRef}
        id="user-menu-panel"
        className={cn(
          "absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-xl border border-border-subtle bg-surface p-2 shadow-[var(--shadow-popover)]",
          "transition-all duration-150",
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <div className="border-b border-border-subtle px-3 py-2">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <Badge variant="brand" className="mt-1">
            {role === "HOST" ? "Host" : "Guest"}
          </Badge>
        </div>

        <div className="flex flex-col py-1">
          {role === "HOST" && (
            <Link
              href="/host/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-surface-muted"
            >
              <LayoutDashboard className="h-4 w-4" /> Host dashboard
            </Link>
          )}
          <Link
            href="/bookings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-surface-muted"
          >
            <Luggage className="h-4 w-4" /> My trips
          </Link>
          <Link
            href="/wishlist"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-surface-muted"
          >
            <Heart className="h-4 w-4" /> Wishlist
          </Link>
        </div>

        <div className="border-t border-border-subtle pt-1">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-surface-muted"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

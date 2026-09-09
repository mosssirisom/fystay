import { MessageCircle, Zap } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ContactHostButton } from "@/components/ContactHostButton";
import { formatResponseTime } from "@/lib/hostStats";

/**
 * Everything here is a real column on a real row: the host's name, the
 * year their account was created, how many published reviews exist across
 * every listing they run (not just this one - a host with one glowing
 * review on their tenth property and a host with their first-ever review
 * look identical from a single listing's own count), and their response
 * rate/time computed from real Message history (see hostStats.ts). Both
 * are omitted entirely rather than shown as 0%/blank when the host has no
 * guest-initiated conversations yet - an unearned or fabricated trust
 * signal erodes trust the moment a guest notices it doesn't add up. No
 * "Identity verified" badge, because nothing in this schema tracks that.
 */
export function HostCard({
  hostName,
  hostImage,
  hostingSinceYear,
  reviewCount,
  responseRate,
  medianResponseMinutes,
  listingId,
  isLoggedIn,
  isOwnListing,
}: {
  hostName: string;
  hostImage?: string | null;
  hostingSinceYear: number;
  reviewCount: number;
  responseRate: number | null;
  medianResponseMinutes: number | null;
  listingId: string;
  isLoggedIn: boolean;
  isOwnListing: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar name={hostName} src={hostImage} size={56} className="ring-2 ring-brand-50" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Hosted by</p>
          <p className="text-lg font-semibold text-foreground">{hostName}</p>
          <p className="mt-0.5 text-sm text-zinc-500">
            FYStay host since {hostingSinceYear}
            {reviewCount > 0 && ` · ${reviewCount} review${reviewCount === 1 ? "" : "s"}`}
          </p>
          {responseRate !== null && (
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                {responseRate}% response rate
              </span>
              {medianResponseMinutes !== null && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                  Responds {formatResponseTime(medianResponseMinutes)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {!isOwnListing && (
        <ContactHostButton listingId={listingId} hostName={hostName} isLoggedIn={isLoggedIn} />
      )}
    </div>
  );
}

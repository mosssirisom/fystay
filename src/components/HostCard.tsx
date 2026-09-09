import { Avatar } from "@/components/ui/Avatar";
import { ContactHostButton } from "@/components/ContactHostButton";

/**
 * Everything here is a real column on a real row: the host's name, the
 * year their account was created, and how many published reviews exist
 * across every listing they run (not just this one - a host with one
 * glowing review on their tenth property and a host with their first-ever
 * review look identical from a single listing's own count). No "Identity
 * verified" or "Responds quickly" badge, because nothing in this schema
 * actually tracks either - a badge with nothing behind it is exactly the
 * kind of unearned trust signal that erodes trust once a guest notices.
 */
export function HostCard({
  hostName,
  hostImage,
  hostingSinceYear,
  reviewCount,
  listingId,
  isLoggedIn,
  isOwnListing,
}: {
  hostName: string;
  hostImage?: string | null;
  hostingSinceYear: number;
  reviewCount: number;
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
        </div>
      </div>
      {!isOwnListing && (
        <ContactHostButton listingId={listingId} hostName={hostName} isLoggedIn={isLoggedIn} />
      )}
    </div>
  );
}

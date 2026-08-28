import { Skeleton } from "@/components/ui/Skeleton";
import { ListingsGridSkeleton } from "@/components/ListingCardSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <Skeleton className="h-7 w-32" />
      <div className="mt-6">
        <ListingsGridSkeleton />
      </div>
    </div>
  );
}

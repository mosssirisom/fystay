import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <div>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-1.5 h-3.5 w-48" />
        </div>
      </div>

      <Skeleton className="mt-6 h-16 w-full rounded-2xl" />

      <div className="mt-6 flex flex-col gap-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}

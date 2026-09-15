import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1.5 h-3.5 w-32" />
        </div>
      </div>

      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-5/6" />

      <Skeleton className="mt-6 h-32 w-full rounded-2xl" />

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}

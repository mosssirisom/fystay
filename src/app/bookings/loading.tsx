import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <Skeleton className="h-7 w-40" />
      <div className="mt-6 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-border-subtle p-4">
            <Skeleton className="h-20 w-28 shrink-0 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2 h-3.5 w-1/3" />
              <Skeleton className="mt-2 h-3.5 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

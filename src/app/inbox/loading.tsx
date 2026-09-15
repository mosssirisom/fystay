import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <Skeleton className="h-7 w-32" />
      <div className="mt-6 flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border-subtle p-4"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-3.5 w-1/4" />
              <Skeleton className="mt-2 h-3.5 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="mt-8 h-64 w-full rounded-2xl" />
      <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
    </div>
  );
}

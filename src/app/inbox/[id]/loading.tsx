import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
      <Skeleton className="h-4 w-32" />
      <div className="mt-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-1.5 h-3.5 w-56" />
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-3">
        <Skeleton className="h-10 w-2/3 self-start rounded-2xl" />
        <Skeleton className="h-10 w-1/2 self-end rounded-2xl" />
        <Skeleton className="h-10 w-3/5 self-start rounded-2xl" />
        <Skeleton className="h-10 w-2/5 self-end rounded-2xl" />
      </div>

      <Skeleton className="mt-6 h-24 w-full rounded-2xl" />
    </div>
  );
}

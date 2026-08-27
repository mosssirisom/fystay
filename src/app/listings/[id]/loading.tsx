import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/3" />

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <Skeleton className="col-span-2 row-span-2 aspect-square rounded-2xl sm:col-span-2 sm:row-span-2" />
        <Skeleton className="hidden aspect-square rounded-2xl sm:block" />
        <Skeleton className="hidden aspect-square rounded-2xl sm:block" />
        <Skeleton className="hidden aspect-square rounded-2xl sm:block" />
        <Skeleton className="hidden aspect-square rounded-2xl sm:block" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

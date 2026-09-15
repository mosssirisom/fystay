import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-6 h-[28rem] w-full rounded-2xl" />
    </div>
  );
}

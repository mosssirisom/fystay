import Image from "next/image";
import { cn } from "@/lib/cn";
import { isOptimizableImage } from "@/lib/image";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-800",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          unoptimized={!isOptimizableImage(src)}
        />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>{initials(name)}</span>
      )}
    </div>
  );
}

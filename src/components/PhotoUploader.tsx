"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/Spinner";
import { isOptimizableImage } from "@/lib/image";
import { cn } from "@/lib/cn";

export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? `Couldn't upload ${file.name}`);
          continue;
        }
        uploaded.push(data.url);
      } catch {
        toast.error(`Couldn't upload ${file.name}`);
      }
    }

    setUploading(false);
    if (uploaded.length > 0) {
      onChange([...photos, ...uploaded]);
    }
  }

  function removePhoto(url: string) {
    onChange(photos.filter((p) => p !== url));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((url, i) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-lg bg-surface-muted"
          >
            <Image
              src={url}
              alt=""
              fill
              className="object-cover"
              sizes="150px"
              unoptimized={!isOptimizableImage(url)}
            />
            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => removePhoto(url)}
              aria-label="Remove photo"
              className="focus-ring absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "focus-ring flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border-subtle text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-500",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? <Spinner /> : <ImagePlus className="h-5 w-5" />}
          <span className="text-xs font-medium">{uploading ? "Uploading…" : "Add photo"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

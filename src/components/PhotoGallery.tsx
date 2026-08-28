"use client";

import { useState } from "react";
import Image from "next/image";
import { Grip, ImageOff } from "lucide-react";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { isOptimizableImage } from "@/lib/image";

export function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="mt-4 flex aspect-[16/7] w-full items-center justify-center rounded-2xl bg-surface-muted text-zinc-400">
        <ImageOff className="h-8 w-8" />
      </div>
    );
  }

  const visible = photos.slice(0, 5);

  return (
    <>
      <div className="relative mt-4 grid grid-cols-2 gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
        {visible.map((photo, i) => (
          <button
            key={photo}
            onClick={() => setLightboxIndex(i)}
            className={`focus-ring relative aspect-square bg-surface-muted ${
              i === 0 ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2" : "hidden sm:block"
            }`}
          >
            <Image
              src={photo}
              alt={`${title} photo ${i + 1}`}
              fill
              className="object-cover transition hover:brightness-95"
              sizes={i === 0 ? "50vw" : "25vw"}
              unoptimized={!isOptimizableImage(photo)}
              priority={i === 0}
            />
          </button>
        ))}

        {photos.length > 1 && (
          <button
            onClick={() => setLightboxIndex(0)}
            className="focus-ring absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-card)] hover:bg-surface-muted"
          >
            <Grip className="h-3.5 w-3.5" />
            Show all photos
          </button>
        )}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          title={title}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

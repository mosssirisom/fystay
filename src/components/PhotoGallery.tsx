"use client";

import { useState } from "react";
import Image from "next/image";
import { Grip, ImageOff } from "lucide-react";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { SaveButton } from "@/components/SaveButton";
import { isOptimizableImage } from "@/lib/image";

// One large hero plus up to this many stacked thumbnails alongside it - a
// vertical rail rather than the 2x2 photo mosaic most booking sites use, so
// the gallery still reads as distinctly FYstay's own even before any text
// on the page does.
const MAX_THUMBNAILS = 3;

export function PhotoGallery({
  photos,
  title,
  listingId,
  isSaved = false,
  isLoggedIn = false,
}: {
  photos: string[];
  title: string;
  /** Omit on read-only contexts (e.g. a booking's own photo recap) where saving to a wishlist doesn't apply. */
  listingId?: string;
  isSaved?: boolean;
  isLoggedIn?: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="relative mt-4 flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-brand-50 text-brand-300 sm:aspect-[21/9]">
        <ImageOff className="h-8 w-8" />
        {listingId && (
          <SaveButton
            listingId={listingId}
            initialSaved={isSaved}
            isLoggedIn={isLoggedIn}
            className="absolute right-3 top-3 z-10 h-10 w-10 bg-white/85 shadow-[var(--shadow-card)] backdrop-blur-sm hover:bg-white"
          />
        )}
      </div>
    );
  }

  const thumbnails = photos.slice(1, 1 + MAX_THUMBNAILS);
  const morePhotosCount = photos.length - 1 - thumbnails.length;

  return (
    <>
      <div className="relative mt-4 flex flex-col gap-2 sm:h-[420px] sm:flex-row lg:h-[480px]">
        <div className="relative w-full sm:h-full sm:flex-[2]">
          <button
            type="button"
            data-testid="gallery-tile"
            onClick={() => setLightboxIndex(0)}
            className="focus-ring relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-muted sm:aspect-auto sm:h-full"
          >
            <Image
              src={photos[0]}
              alt={`${title} photo 1`}
              fill
              className="object-cover transition hover:brightness-95"
              sizes="(max-width: 640px) 100vw, 66vw"
              unoptimized={!isOptimizableImage(photos[0])}
              priority
            />
          </button>

          {listingId && (
            <SaveButton
              listingId={listingId}
              initialSaved={isSaved}
              isLoggedIn={isLoggedIn}
              className="absolute right-3 top-3 z-10 h-10 w-10 bg-white/85 shadow-[var(--shadow-card)] backdrop-blur-sm hover:bg-white"
            />
          )}
        </div>

        {thumbnails.length > 0 && (
          <div className="hidden gap-2 sm:flex sm:h-full sm:flex-1 sm:flex-col">
            {thumbnails.map((photo, i) => {
              const photoIndex = i + 1;
              const isLastThumbnail = i === thumbnails.length - 1;
              return (
                <button
                  key={photo}
                  type="button"
                  data-testid="gallery-tile"
                  onClick={() => setLightboxIndex(photoIndex)}
                  className="focus-ring relative flex-1 overflow-hidden rounded-2xl bg-surface-muted"
                >
                  <Image
                    src={photo}
                    alt={`${title} photo ${photoIndex + 1}`}
                    fill
                    className="object-cover transition hover:brightness-95"
                    sizes="33vw"
                    unoptimized={!isOptimizableImage(photo)}
                  />
                  {isLastThumbnail && morePhotosCount > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                      +{morePhotosCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="focus-ring absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-foreground shadow-[var(--shadow-card)] backdrop-blur-sm hover:bg-white"
          >
            <Grip className="h-3.5 w-3.5" />
            Show all {photos.length} photos
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

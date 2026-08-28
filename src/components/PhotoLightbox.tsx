"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { isOptimizableImage } from "@/lib/image";

// How far (in px) a drag has to travel before it counts as a swipe rather
// than a tap, and separately, before release commits to the next/previous
// photo instead of springing back to the current one.
const AXIS_LOCK_THRESHOLD_PX = 6;
const SWIPE_COMMIT_THRESHOLD_PX = 60;
// Dragging past the first/last photo still moves a little, like iOS/Airbnb's
// rubber-banding, rather than refusing to budge at all.
const EDGE_RESISTANCE = 0.25;

export function PhotoLightbox({
  photos,
  title,
  index,
  onIndexChange,
  onClose,
}: {
  photos: string[];
  title: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const axisLocked = useRef<"horizontal" | "vertical" | null>(null);

  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // No cleanup here: closing the dialog imperatively would fire its native
    // `close` event, which is wired to onClose below, so it would collapse
    // the parent's open state right back to closed the instant this effect's
    // cleanup runs (React Strict Mode runs every effect's cleanup once as a
    // dev-only check, even on first mount). Unmounting the element itself is
    // enough for the browser to tear the dialog down without that event.
    if (!dialog.open) dialog.showModal();
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && index < photos.length - 1) onIndexChange(index + 1);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [index, photos.length, onIndexChange]);

  function handlePointerDown(e: ReactPointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    axisLocked.current = null;
    setIsDragging(true);
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;

    if (axisLocked.current === null) {
      if (Math.abs(dx) < AXIS_LOCK_THRESHOLD_PX && Math.abs(dy) < AXIS_LOCK_THRESHOLD_PX) return;
      axisLocked.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }
    if (axisLocked.current === "vertical") return;

    e.preventDefault();
    let clamped = dx;
    if (dx > 0 && !hasPrev) clamped = dx * EDGE_RESISTANCE;
    if (dx < 0 && !hasNext) clamped = dx * EDGE_RESISTANCE;
    setDragOffset(clamped);
  }

  function endDrag() {
    if (axisLocked.current === "horizontal") {
      if (dragOffset <= -SWIPE_COMMIT_THRESHOLD_PX && hasNext) onIndexChange(index + 1);
      else if (dragOffset >= SWIPE_COMMIT_THRESHOLD_PX && hasPrev) onIndexChange(index - 1);
    }
    setDragOffset(0);
    setIsDragging(false);
    pointerStart.current = null;
    axisLocked.current = null;
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      aria-label={`${title} photos`}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-background p-0 backdrop:bg-black/70"
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-sm font-medium text-foreground">
            {index + 1} / {photos.length}
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-surface-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="relative min-h-0 flex-1 touch-none select-none overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            className="flex h-full"
            style={{
              transform: `translateX(calc(${-index * 100}% + ${dragOffset}px))`,
              transition: isDragging ? "none" : "transform 280ms ease-out",
            }}
          >
            {photos.map((photo, i) => (
              <div key={photo} className="relative h-full w-full shrink-0 px-3 sm:px-10">
                {Math.abs(i - index) <= 1 && (
                  <Image
                    src={photo}
                    alt={`${title} photo ${i + 1}`}
                    fill
                    draggable={false}
                    className="pointer-events-none object-contain"
                    sizes="100vw"
                    unoptimized={!isOptimizableImage(photo)}
                    priority={i === index}
                  />
                )}
              </div>
            ))}
          </div>

          {hasPrev && (
            <button
              type="button"
              onClick={() => onIndexChange(index - 1)}
              aria-label="Previous photo"
              className={cn(
                "focus-ring absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full",
                "bg-surface/90 shadow-[var(--shadow-card)] hover:bg-surface sm:left-6",
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={() => onIndexChange(index + 1)}
              aria-label="Next photo"
              className={cn(
                "focus-ring absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full",
                "bg-surface/90 shadow-[var(--shadow-card)] hover:bg-surface sm:right-6",
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

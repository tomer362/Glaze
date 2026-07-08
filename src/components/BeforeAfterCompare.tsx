"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "./ImageLightbox";

const HOLD_MS = 250; // press-and-hold threshold before the peek kicks in
const MOVE_CANCEL_PX = 10; // finger/mouse movement that cancels a pending hold

/** One side of the compare — either a photo or a solid color swatch. */
export type CompareFace = {
  imageUrl?: string | null;
  hex?: string | null;
  alt: string;
};

function faceHasContent(face: CompareFace) {
  return !!(face.imageUrl || face.hex);
}

/** Fills its (positioned) parent with the face's photo, or a solid color. */
function FaceView({
  face,
  priority,
}: {
  face: CompareFace;
  priority?: boolean;
}) {
  if (face.imageUrl) {
    return (
      <Image
        src={face.imageUrl}
        alt={face.alt}
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover"
        draggable={false}
        priority={priority}
      />
    );
  }
  return (
    <div
      className="absolute inset-0"
      style={{ backgroundColor: face.hex ?? "#cfc6ba" }}
    />
  );
}

/**
 * Inline before/after preview box. Shows `primary`; press-and-hold anywhere on
 * it to peek at `peek` (release to revert). Each side may be a photo or a solid
 * color swatch, so this drives both directions of the compare (hold the result
 * to see the "before", hold the "before" to see the result).
 *
 * A short tap on a photo `primary` opens the fullscreen zoom viewer; a color
 * swatch has nothing to zoom, so a tap there is a no-op. Page scroll is
 * preserved — a drag past MOVE_CANCEL_PX cancels a pending peek.
 *
 * The parent supplies the surrounding card; this renders the aspect-ratio box.
 */
export function BeforeAfterCompare({
  primary,
  peek,
  peekLabel,
  aspectClassName = "aspect-[16/10]",
}: {
  primary: CompareFace;
  peek: CompareFace;
  /** Short Hebrew label for what the peek reveals, shown in the hint pill. */
  peekLabel: string;
  aspectClassName?: string;
}) {
  const [comparing, setComparing] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const didPeek = useRef(false);
  const moved = useRef(false);

  const canPeek = faceHasContent(peek);
  const primaryIsImage = !!primary.imageUrl;

  function clearHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    didPeek.current = false;
    moved.current = false;
    if (canPeek) {
      holdTimer.current = setTimeout(() => {
        didPeek.current = true;
        setComparing(true);
      }, HOLD_MS);
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    // A real move means a drag/scroll, not a static hold — cancel the peek.
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
      moved.current = true;
      clearHold();
    }
  }

  function endPointer(e: React.PointerEvent) {
    clearHold();
    const wasPeek = didPeek.current;
    if (comparing) setComparing(false);
    pointerStart.current = null;
    // A short static tap on a photo opens the fullscreen zoom. Ignore holds,
    // drags, and pointercancel/leave (only a real pointerup is a tap).
    if (
      e.type === "pointerup" &&
      !wasPeek &&
      !moved.current &&
      primaryIsImage
    ) {
      setZoomOpen(true);
    }
    didPeek.current = false;
    moved.current = false;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (primaryIsImage && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setZoomOpen(true);
    }
  }

  return (
    <>
      <div
        className={`relative w-full select-none touch-pan-y bg-background ${aspectClassName} ${
          primaryIsImage ? "cursor-zoom-in" : canPeek ? "cursor-pointer" : ""
        }`}
        role={primaryIsImage ? "button" : undefined}
        tabIndex={primaryIsImage ? 0 : undefined}
        aria-label={primaryIsImage ? `הגדלת התמונה: ${primary.alt}` : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onKeyDown={onKeyDown}
      >
        <FaceView face={primary} priority />

        {canPeek && (
          <div
            aria-hidden={!comparing}
            className={`absolute inset-0 transition-opacity duration-150 ${
              comparing ? "opacity-100" : "opacity-0"
            }`}
          >
            <FaceView face={peek} />
          </div>
        )}

        {canPeek && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3">
            <span className="rounded-full bg-black/55 px-3 py-1 text-xs text-white backdrop-blur-sm">
              {comparing ? peekLabel : `החזיקו להשוואה — ${peekLabel}`}
            </span>
          </div>
        )}
      </div>

      {primaryIsImage && (
        <ImageLightbox
          src={primary.imageUrl!}
          alt={primary.alt}
          hideTrigger
          open={zoomOpen}
          onOpenChange={setZoomOpen}
        />
      )}
    </>
  );
}

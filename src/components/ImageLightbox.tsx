"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const HOLD_MS = 250; // press-and-hold threshold before the before→after compare kicks in
const MOVE_CANCEL_PX = 10; // finger/mouse movement that cancels a pending hold

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Click any image to open a full-screen, zoomable preview (buttons, wheel, and
 * double-tap zoom; drag to pan when zoomed). Mirrors NewColorDialog's portal +
 * Escape + backdrop pattern.
 *
 * When `compareSrc` is given (the mixture "before" photo passing its fired
 * `resultImageUrl`), a press-and-hold at default zoom temporarily swaps to the
 * compare image and reverts on release — a quick before→after comparison.
 *
 * The trigger is whatever you pass as `children` (usually the thumbnail
 * <Image>); `className` styles the button wrapper around it.
 */
export function ImageLightbox({
  src,
  alt,
  compareSrc,
  compareLabel,
  className,
  children,
}: {
  src: string;
  alt: string;
  /** Optional image shown while pressing-and-holding (before→after compare). */
  compareSrc?: string | null;
  compareLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [comparing, setComparing] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  const reset = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setComparing(false);
    dragging.current = false;
    pointerStart.current = null;
    panStart.current = null;
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  // Escape to close + lock body scroll while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  // Wheel to zoom — attached natively so we can preventDefault (React's onWheel
  // is passive and would warn).
  useEffect(() => {
    const stage = stageRef.current;
    if (!open || !stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => clamp(s - e.deltaY * 0.002, MIN_SCALE, MAX_SCALE));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [open]);

  function zoomBy(delta: number) {
    setScale((s) => clamp(s + delta, MIN_SCALE, MAX_SCALE));
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointerStart.current = { x: e.clientX, y: e.clientY };

    if (scale > 1) {
      // Zoomed in → this press starts a pan.
      dragging.current = true;
      panStart.current = { ...pan };
    } else if (compareSrc) {
      // At 1× with a compare image → arm the hold-to-compare gesture.
      holdTimer.current = setTimeout(() => setComparing(true), HOLD_MS);
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;

    if (dragging.current && panStart.current) {
      setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
      return;
    }
    // A real move means it wasn't a static hold — cancel a pending compare.
    if (
      holdTimer.current &&
      Math.hypot(dx, dy) > MOVE_CANCEL_PX
    ) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function endPointer() {
    dragging.current = false;
    pointerStart.current = null;
    panStart.current = null;
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (comparing) setComparing(false);
  }

  function onDoubleClick() {
    setScale((s) => (s > 1 ? 1 : 2));
  }

  const current = comparing && compareSrc ? compareSrc : src;
  // Pan only applies when zoomed in; at 1× the image stays centered.
  const applied = scale > 1 ? pan : { x: 0, y: 0 };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`הגדלת התמונה: ${alt}`}
        className={className}
      >
        {children}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={close}
            role="presentation"
          >
            {/* Controls */}
            <div
              className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => zoomBy(-0.5)}
                  aria-label="הקטנה"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => zoomBy(0.5)}
                  aria-label="הגדלה"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="סגירה"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              >
                ✕
              </button>
            </div>

            {/* Zoom / pan / compare stage */}
            <div
              ref={stageRef}
              className="relative h-[85vh] w-full max-w-4xl touch-none select-none overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={onDoubleClick}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
              onPointerLeave={endPointer}
              style={{ cursor: scale > 1 ? "grab" : "default" }}
            >
              <div
                className="relative h-full w-full transition-transform duration-75"
                style={{
                  transform: `translate(${applied.x}px, ${applied.y}px) scale(${scale})`,
                }}
              >
                <Image
                  src={current}
                  alt={alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  draggable={false}
                  priority
                />
              </div>
            </div>

            {/* Compare hint */}
            {compareSrc && (
              <div
                className="absolute inset-x-0 bottom-0 flex justify-center p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm text-white">
                  {comparing
                    ? compareLabel ?? "התוצאה"
                    : `החזק להשוואה${compareLabel ? ` עם ${compareLabel}` : ""}`}
                </span>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

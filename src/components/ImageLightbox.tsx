"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Full-screen, zoomable image preview (buttons, wheel, and double-tap zoom; drag
 * to pan when zoomed). Mirrors NewColorDialog's portal + Escape + backdrop
 * pattern.
 *
 * Uncontrolled by default: the trigger is whatever you pass as `children`
 * (usually the thumbnail <Image>) and clicking it opens the overlay;
 * `className` styles the button wrapper around it.
 *
 * Optionally controllable: pass `open`/`onOpenChange` to drive it from a parent
 * (e.g. BeforeAfterCompare opens it on a tap), and `hideTrigger` to skip the
 * built-in button when the parent already supplies its own trigger element.
 *
 * The before→after press-and-hold compare used to live here; it now lives in
 * BeforeAfterCompare so it can work inline on the preview card.
 */
export function ImageLightbox({
  src,
  alt,
  className,
  children,
  open: openProp,
  onOpenChange,
  hideTrigger,
}: {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
  /** Controlled open state. When omitted, the component manages its own. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Skip the built-in trigger button (the parent opens it via `open`). */
  hideTrigger?: boolean;
}) {
  const isControlled = openProp !== undefined;
  const [openState, setOpenState] = useState(false);
  const open = isControlled ? openProp : openState;

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const stageRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!next) {
        // Reset zoom/pan on close so the next open starts fresh.
        setScale(1);
        setPan({ x: 0, y: 0 });
        dragging.current = false;
        pointerStart.current = null;
        panStart.current = null;
      }
      if (!isControlled) setOpenState(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

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
    if (scale <= 1) return; // panning only makes sense when zoomed in
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointerStart.current = { x: e.clientX, y: e.clientY };
    dragging.current = true;
    panStart.current = { ...pan };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || !pointerStart.current || !panStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  }

  function endPointer() {
    dragging.current = false;
    pointerStart.current = null;
    panStart.current = null;
  }

  function onDoubleClick() {
    setScale((s) => (s > 1 ? 1 : 2));
  }

  // Pan only applies when zoomed in; at 1× the image stays centered.
  const applied = scale > 1 ? pan : { x: 0, y: 0 };

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`הגדלת התמונה: ${alt}`}
          className={className}
        >
          {children}
        </button>
      )}

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

            {/* Zoom / pan stage */}
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
                  src={src}
                  alt={alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  draggable={false}
                  priority
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

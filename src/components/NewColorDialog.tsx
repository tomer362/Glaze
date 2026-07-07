"use client";

import { useActionState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createColorInline } from "@/lib/actions/colors";
import { ColorFormFields } from "./ColorFormFields";
import type { ColorOption } from "./MixtureColorBuilder";

/**
 * Popup for creating a new color without leaving the mixture form. Uses the same
 * inputs as the /colors/new page; on success it hands the created color back to
 * the caller (which adds it to the current mix) and closes.
 *
 * Rendered through a portal into <body> so its <form> isn't nested inside the
 * surrounding mixture <form> (nested forms are invalid HTML).
 */
export function NewColorDialog({
  initialName,
  onClose,
  onCreated,
}: {
  initialName: string;
  onClose: () => void;
  onCreated: (color: ColorOption) => void;
}) {
  const [state, action, pending] = useActionState(createColorInline, {});

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // On success, hand the new color to the caller and close.
  useEffect(() => {
    if (state.color) {
      onCreated(state.color);
      onClose();
    }
  }, [state.color, onCreated, onClose]);

  // Only rendered on user click (client-side), so document is always defined;
  // guard anyway so an accidental server render doesn't throw.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="הוספת צבע חדש"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">הוספת צבע חדש</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="rounded-md px-2 py-1 text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <ColorFormFields defaultName={initialName} />

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "שומר…" : "הוספת הצבע"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-background"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

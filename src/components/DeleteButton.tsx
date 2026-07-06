"use client";

import { useState, useTransition } from "react";
import { Spinner } from "./Spinner";

/**
 * Owner-only delete button. `action` is a server action already bound to the
 * target id; it either redirects on success or returns `{ error }`.
 */
export function DeleteButton({
  action,
  label = "מחיקה",
  confirmText = "בטוח? הפעולה בלתי הפיכה.",
}: {
  action: () => Promise<{ error?: string } | void>;
  label?: string;
  confirmText?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onClick() {
    if (!window.confirm(confirmText)) return;
    setError("");
    startTransition(async () => {
      const res = await action();
      if (res && "error" in res && res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
      >
        {isPending && <Spinner className="h-4 w-4" />}
        {label}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { createColor } from "@/lib/actions/colors";
import { ImageUpload } from "./ImageUpload";

const fieldClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

export function ColorForm() {
  const [state, action, pending] = useActionState(createColor, {});
  const [useHex, setUseHex] = useState(false);
  const [hex, setHex] = useState("#7c9bb3");

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          שם הצבע <span className="text-primary">*</span>
        </span>
        <input name="name" required className={fieldClass} placeholder="למשל: טורקיז מבריק" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">מותג</span>
          <input name="brand" className={fieldClass} placeholder="לא חובה" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">קוד / מק״ט</span>
          <input name="code" className={fieldClass} placeholder="לא חובה" />
        </label>
      </div>

      <ImageUpload name="imageUrl" label="תמונה של הגלזורה השרופה" />

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={useHex}
            onChange={(e) => setUseHex(e.target.checked)}
          />
          הוספת דגימת צבע משוערת (אם אין תמונה)
        </label>
        {useHex && (
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded border border-border bg-surface"
          />
        )}
        <input type="hidden" name="hex" value={useHex ? hex : ""} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "שומר…" : "הוספת הצבע"}
      </button>
    </form>
  );
}

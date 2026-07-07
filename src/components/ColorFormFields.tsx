"use client";

import { useState } from "react";
import { ImageUpload } from "./ImageUpload";

const fieldClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

/**
 * The create-color inputs (name, brand, code, image, optional hex swatch),
 * with no <form>/action/submit of their own. Shared by the /colors/new page
 * form and the "add color" popup so both capture identical fields.
 */
export function ColorFormFields({ defaultName }: { defaultName?: string }) {
  const [useHex, setUseHex] = useState(false);
  const [hex, setHex] = useState("#7c9bb3");

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          שם הצבע <span className="text-primary">*</span>
        </span>
        <input
          name="name"
          required
          defaultValue={defaultName}
          className={fieldClass}
          placeholder="למשל: טורקיז מבריק"
        />
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
    </>
  );
}

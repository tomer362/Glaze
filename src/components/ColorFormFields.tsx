"use client";

import { useState } from "react";
import { ImageUpload } from "./ImageUpload";

const fieldClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

export type ColorFieldDefaults = {
  name?: string;
  brand?: string | null;
  code?: string | null;
  hex?: string | null;
  imageUrl?: string | null;
};

/**
 * The color inputs (name, brand, code, image, optional hex swatch), with no
 * <form>/action/submit of their own. Shared by the /colors/new page form, the
 * "add color" popup, and the edit page — passing `defaults` pre-fills every
 * field so the same component drives both create and edit.
 */
export function ColorFormFields({
  defaultName,
  defaults,
}: {
  defaultName?: string;
  defaults?: ColorFieldDefaults;
}) {
  const initialName = defaults?.name ?? defaultName;
  const initialHex = defaults?.hex ?? "";
  const [useHex, setUseHex] = useState(!!initialHex);
  const [hex, setHex] = useState(initialHex || "#7c9bb3");

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          שם הצבע <span className="text-primary">*</span>
        </span>
        <input
          name="name"
          required
          defaultValue={initialName}
          className={fieldClass}
          placeholder="למשל: טורקיז מבריק"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">מותג</span>
          <input
            name="brand"
            defaultValue={defaults?.brand ?? ""}
            className={fieldClass}
            placeholder="לא חובה"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">קוד / מק״ט</span>
          <input
            name="code"
            defaultValue={defaults?.code ?? ""}
            className={fieldClass}
            placeholder="לא חובה"
          />
        </label>
      </div>

      <ImageUpload
        name="imageUrl"
        label="תמונה של הגלזורה השרופה"
        defaultUrl={defaults?.imageUrl ?? ""}
      />

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

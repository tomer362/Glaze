"use client";

import { useActionState, useState } from "react";
import { createMixture, updateMixture } from "@/lib/actions/mixtures";
import { ImageUpload } from "./ImageUpload";
import {
  MixtureColorBuilder,
  type ColorOption,
  type InitialComponent,
} from "./MixtureColorBuilder";

const fieldClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

export type MixtureEditData = {
  id: string;
  name: string;
  notes: string | null;
  beforeImageUrl: string | null;
  beforeHex: string | null;
  resultImageUrl: string | null;
  components: InitialComponent[];
};

export function MixtureForm({
  colors,
  initialColorIds,
  edit,
}: {
  colors: ColorOption[];
  initialColorIds?: string[];
  /** When present, the form edits an existing mixture instead of creating one. */
  edit?: MixtureEditData;
}) {
  // Editing binds the id and calls updateMixture; creating calls createMixture.
  const action = edit ? updateMixture.bind(null, edit.id) : createMixture;
  const [state, formAction, pending] = useActionState(action, {});

  // Keep the text fields in React state. React 19 resets the <form> after a
  // server action returns without redirecting, which would wipe uncontrolled
  // inputs on a validation error; controlled values survive that re-render, so
  // the user doesn't lose what they typed. (The color/image/hex fields are
  // already state-backed and survive for the same reason.)
  const [name, setName] = useState(edit?.name ?? "");
  const [notes, setNotes] = useState(edit?.notes ?? "");

  // Optional "before" color — an alternative to the before photo (image wins if
  // both are set). Mirrors the hex picker in ColorFormFields.
  const initialBeforeHex = edit?.beforeHex ?? "";
  const [useBeforeHex, setUseBeforeHex] = useState(!!initialBeforeHex);
  const [beforeHex, setBeforeHex] = useState(initialBeforeHex || "#cfc6ba");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          שם התוצאה <span className="text-primary">*</span>
        </span>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          placeholder="למשל: ירוק ים עמוק"
        />
      </label>

      <MixtureColorBuilder
        colors={colors}
        initialColorIds={initialColorIds}
        initialComponents={edit?.components}
      />

      <div className="flex flex-col gap-3">
        {/* The before photo and the before color are alternatives. Once a
            before color is chosen we drop the photo input entirely — unmounting
            removes its hidden beforeImageUrl input from the form, so the color
            choice wins instead of a stale image URL. */}
        {!useBeforeHex && (
          <ImageUpload
            name="beforeImageUrl"
            label="תמונת הכלי לפני השריפה (לא חובה)"
            defaultUrl={edit?.beforeImageUrl ?? ""}
          />
        )}

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={useBeforeHex}
              onChange={(e) => setUseBeforeHex(e.target.checked)}
            />
            או בחרו צבע &quot;לפני&quot; (אם אין תמונה)
          </label>
          {useBeforeHex && (
            <input
              type="color"
              value={beforeHex}
              onChange={(e) => setBeforeHex(e.target.value)}
              className="h-10 w-20 cursor-pointer rounded border border-border bg-surface"
            />
          )}
          <input
            type="hidden"
            name="beforeHex"
            value={useBeforeHex ? beforeHex : ""}
          />
        </div>
      </div>

      <ImageUpload
        name="resultImageUrl"
        label="תמונה של התוצאה השרופה"
        required
        defaultUrl={edit?.resultImageUrl ?? ""}
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">הערות</span>
        <textarea
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={fieldClass}
          placeholder="טמפרטורה, מספר שכבות, סוג חומר, וכל דבר שיעזור לאחרים…"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "שומר…" : edit ? "שמירת השינויים" : "פרסום הערבוב"}
      </button>
    </form>
  );
}

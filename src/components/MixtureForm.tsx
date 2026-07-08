"use client";

import { useActionState } from "react";
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

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          שם התוצאה <span className="text-primary">*</span>
        </span>
        <input
          name="name"
          required
          defaultValue={edit?.name}
          className={fieldClass}
          placeholder="למשל: ירוק ים עמוק"
        />
      </label>

      <MixtureColorBuilder
        colors={colors}
        initialColorIds={initialColorIds}
        initialComponents={edit?.components}
      />

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
          defaultValue={edit?.notes ?? ""}
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

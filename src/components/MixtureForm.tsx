"use client";

import { useActionState } from "react";
import { createMixture } from "@/lib/actions/mixtures";
import { ImageUpload } from "./ImageUpload";
import { MixtureColorBuilder, type ColorOption } from "./MixtureColorBuilder";

const fieldClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

export function MixtureForm({ colors }: { colors: ColorOption[] }) {
  const [state, action, pending] = useActionState(createMixture, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          שם התוצאה <span className="text-primary">*</span>
        </span>
        <input
          name="name"
          required
          className={fieldClass}
          placeholder="למשל: ירוק ים עמוק"
        />
      </label>

      <MixtureColorBuilder colors={colors} />

      <ImageUpload
        name="resultImageUrl"
        label="תמונה של התוצאה השרופה"
        required
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">הערות</span>
        <textarea
          name="notes"
          rows={3}
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
        {pending ? "שומר…" : "פרסום הערבוב"}
      </button>
    </form>
  );
}

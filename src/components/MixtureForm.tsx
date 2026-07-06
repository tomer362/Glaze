"use client";

import { useActionState, useState } from "react";
import { createMixture } from "@/lib/actions/mixtures";
import { ImageUpload } from "./ImageUpload";
import { MixtureColorBuilder, type ColorOption } from "./MixtureColorBuilder";

const fieldClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

export function MixtureForm({
  colors,
  initialColorIds,
}: {
  colors: ColorOption[];
  initialColorIds?: string[];
}) {
  const [state, action, pending] = useActionState(createMixture, {});
  const [amountsValid, setAmountsValid] = useState(true);

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

      <MixtureColorBuilder
        colors={colors}
        initialColorIds={initialColorIds}
        onAmountsValidityChange={setAmountsValid}
      />

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
      {!amountsValid && (
        <p className="text-sm text-amber-600">
          סכום האחוזים חייב להיות 100% לפני פרסום.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !amountsValid}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "שומר…" : "פרסום הערבוב"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { updateColor } from "@/lib/actions/colors";
import { ColorFormFields, type ColorFieldDefaults } from "./ColorFormFields";

export function EditColorForm({
  id,
  defaults,
}: {
  id: string;
  defaults: ColorFieldDefaults;
}) {
  const action = updateColor.bind(null, id);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ColorFormFields defaults={defaults} />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "שומר…" : "שמירת השינויים"}
      </button>
    </form>
  );
}

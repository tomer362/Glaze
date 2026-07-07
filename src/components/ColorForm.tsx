"use client";

import { useActionState } from "react";
import { createColor } from "@/lib/actions/colors";
import { ColorFormFields } from "./ColorFormFields";

export function ColorForm() {
  const [state, action, pending] = useActionState(createColor, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <ColorFormFields />

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

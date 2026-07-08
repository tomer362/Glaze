"use server";

import { auth } from "@/lib/auth";
import { canEditMixture } from "@/lib/permissions";
import { db } from "@/db";
import { mixtures, mixtureComponents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createMixtureSchema, updateMixtureSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "./colors";

export async function createMixture(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "צריך להתחבר כדי לתעד ערבוב" };

  const str = (k: string) => String(formData.get(k) ?? "");

  let rawComponents: unknown;
  try {
    rawComponents = JSON.parse(str("components") || "[]");
  } catch {
    return { error: "רשימת הצבעים לא תקינה" };
  }

  const parsed = createMixtureSchema.safeParse({
    name: str("name"),
    notes: str("notes"),
    resultImageUrl: str("resultImageUrl"),
    resultHex: str("resultHex"),
    components: rawComponents,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }
  const d = parsed.data;

  const uniqueIds = new Set(d.components.map((c) => c.glazeColorId));
  if (uniqueIds.size !== d.components.length) {
    return { error: "אי אפשר לבחור את אותו צבע פעמיים" };
  }

  const hasAmounts = d.components.some((c) => c.amount != null);

  let newId = "";
  await db.transaction(async (tx) => {
    const [m] = await tx
      .insert(mixtures)
      .values({
        name: d.name,
        notes: d.notes || null,
        resultImageUrl: d.resultImageUrl,
        resultHex: d.resultHex || null,
        hasAmounts,
        createdBy: session.user.id,
      })
      .returning({ id: mixtures.id });

    newId = m.id;

    await tx.insert(mixtureComponents).values(
      d.components.map((c, i) => ({
        mixtureId: m.id,
        glazeColorId: c.glazeColorId,
        amount: c.amount,
        unit: c.unit,
        position: i,
      })),
    );
  });

  revalidatePath("/mixtures");
  revalidatePath("/");
  redirect(`/mixtures/${newId}`);
}

/**
 * Edit an existing mixture. Allowed for admins (any mixture) and for the
 * mixture's own creator. Rewrites the component rows in a transaction, mirroring
 * createMixture. The `id` is bound by the caller so this stays
 * useActionState-friendly.
 */
export async function updateMixture(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "צריך להתחבר כדי לערוך ערבוב" };

  const [existing] = await db
    .select({ createdBy: mixtures.createdBy })
    .from(mixtures)
    .where(eq(mixtures.id, id))
    .limit(1);
  if (!existing) return { error: "הערבוב לא נמצא" };
  if (!canEditMixture(session, existing)) {
    return { error: "אין לך הרשאה לערוך את הערבוב הזה" };
  }

  const str = (k: string) => String(formData.get(k) ?? "");

  let rawComponents: unknown;
  try {
    rawComponents = JSON.parse(str("components") || "[]");
  } catch {
    return { error: "רשימת הצבעים לא תקינה" };
  }

  const parsed = updateMixtureSchema.safeParse({
    name: str("name"),
    notes: str("notes"),
    resultImageUrl: str("resultImageUrl"),
    resultHex: str("resultHex"),
    components: rawComponents,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }
  const d = parsed.data;

  const uniqueIds = new Set(d.components.map((c) => c.glazeColorId));
  if (uniqueIds.size !== d.components.length) {
    return { error: "אי אפשר לבחור את אותו צבע פעמיים" };
  }

  const hasAmounts = d.components.some((c) => c.amount != null);

  await db.transaction(async (tx) => {
    await tx
      .update(mixtures)
      .set({
        name: d.name,
        notes: d.notes || null,
        resultImageUrl: d.resultImageUrl,
        resultHex: d.resultHex || null,
        hasAmounts,
      })
      .where(eq(mixtures.id, id));

    // Replace the component set wholesale — simplest correct reconciliation.
    await tx
      .delete(mixtureComponents)
      .where(eq(mixtureComponents.mixtureId, id));

    await tx.insert(mixtureComponents).values(
      d.components.map((c, i) => ({
        mixtureId: id,
        glazeColorId: c.glazeColorId,
        amount: c.amount,
        unit: c.unit,
        position: i,
      })),
    );
  });

  revalidatePath("/mixtures");
  revalidatePath(`/mixtures/${id}`);
  revalidatePath("/");
  redirect(`/mixtures/${id}`);
}

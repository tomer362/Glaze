"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { mixtures, glazeColors, mixtureComponents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionResult = { error?: string };

/** Delete a mixture — only the user who created it may do so. */
export async function deleteMixture(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "צריך להתחבר" };

  const [row] = await db
    .select({ createdBy: mixtures.createdBy })
    .from(mixtures)
    .where(eq(mixtures.id, id))
    .limit(1);

  if (!row) return { error: "הערבוב לא נמצא" };
  if (row.createdBy !== session.user.id) {
    return { error: "אפשר למחוק רק ערבובים שיצרת" };
  }

  // Components cascade-delete with the mixture.
  await db.delete(mixtures).where(eq(mixtures.id, id));

  revalidatePath("/mixtures");
  revalidatePath("/");
  redirect("/mixtures");
}

/** Delete a user-created color — only its creator, and only if unused. */
export async function deleteColor(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "צריך להתחבר" };

  const [row] = await db
    .select({ createdBy: glazeColors.createdBy, isBase: glazeColors.isBase })
    .from(glazeColors)
    .where(eq(glazeColors.id, id))
    .limit(1);

  if (!row) return { error: "הצבע לא נמצא" };
  if (row.isBase || row.createdBy !== session.user.id) {
    return { error: "אפשר למחוק רק צבעים שהעלית" };
  }

  // The FK from mixture_components → glaze_colors is ON DELETE RESTRICT, so a
  // color used in any mixture can't be removed. Check first for a clear message.
  const [used] = await db
    .select({ id: mixtureComponents.id })
    .from(mixtureComponents)
    .where(eq(mixtureComponents.glazeColorId, id))
    .limit(1);
  if (used) {
    return { error: "הצבע בשימוש בערבובים ולכן אי אפשר למחוק אותו" };
  }

  await db.delete(glazeColors).where(eq(glazeColors.id, id));

  revalidatePath("/colors");
  redirect("/colors");
}

"use server";

import { auth } from "@/lib/auth";
import { canEditColor } from "@/lib/permissions";
import { db } from "@/db";
import { glazeColors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createColorSchema, updateColorSchema } from "@/lib/validators";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { ColorOption } from "@/components/MixtureColorBuilder";

export type FormState = { error?: string };
export type CreateColorState = { error?: string; color?: ColorOption };

type InsertResult =
  | { ok: false; error: string }
  | { ok: true; color: ColorOption };

/**
 * Shared create-color logic: auth check, validation, and the insert. Only a
 * name is required — image and hex are optional. Returns the full new row so
 * callers can either redirect to it or hand it straight back to the client.
 */
async function insertColor(formData: FormData): Promise<InsertResult> {
  const session = await auth();
  if (!session?.user?.id)
    return { ok: false, error: "צריך להתחבר כדי להוסיף צבע" };

  const str = (k: string) => String(formData.get(k) ?? "");

  const parsed = createColorSchema.safeParse({
    name: str("name"),
    brand: str("brand"),
    code: str("code"),
    hex: str("hex"),
    imageUrl: str("imageUrl"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים",
    };
  }
  const d = parsed.data;

  const [row] = await db
    .insert(glazeColors)
    .values({
      name: d.name,
      brand: d.brand || null,
      code: d.code || null,
      hex: d.hex || null,
      imageUrl: d.imageUrl || null,
      isBase: false,
      createdBy: session.user.id,
    })
    .returning({
      id: glazeColors.id,
      name: glazeColors.name,
      brand: glazeColors.brand,
      code: glazeColors.code,
      hex: glazeColors.hex,
      imageUrl: glazeColors.imageUrl,
    });

  return { ok: true, color: row };
}

export async function createColor(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await insertColor(formData);
  if (!result.ok) return { error: result.error };

  revalidatePath("/colors");
  revalidateTag("colors", "max");
  redirect(`/colors/${result.color.id}`);
}

/**
 * Like createColor, but returns the created color instead of redirecting — so a
 * popup can create a color in place and add it straight to the current mixture.
 */
export async function createColorInline(
  _prev: CreateColorState,
  formData: FormData,
): Promise<CreateColorState> {
  const result = await insertColor(formData);
  if (!result.ok) return { error: result.error };

  revalidatePath("/colors");
  revalidateTag("colors", "max");
  return { color: result.color };
}

/**
 * Edit an existing color. Allowed for admins (any color, including seeded base
 * colors — e.g. to add a missing image) and for the color's own creator. The
 * `id` is bound by the caller, so the signature stays useActionState-friendly.
 */
export async function updateColor(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "צריך להתחבר כדי לערוך צבע" };

  const [color] = await db
    .select({ createdBy: glazeColors.createdBy })
    .from(glazeColors)
    .where(eq(glazeColors.id, id))
    .limit(1);
  if (!color) return { error: "הצבע לא נמצא" };
  if (!canEditColor(session, color)) {
    return { error: "אין לך הרשאה לערוך את הצבע הזה" };
  }

  const str = (k: string) => String(formData.get(k) ?? "");
  const parsed = updateColorSchema.safeParse({
    name: str("name"),
    brand: str("brand"),
    code: str("code"),
    hex: str("hex"),
    imageUrl: str("imageUrl"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }
  const d = parsed.data;

  await db
    .update(glazeColors)
    .set({
      name: d.name,
      brand: d.brand || null,
      code: d.code || null,
      hex: d.hex || null,
      imageUrl: d.imageUrl || null,
    })
    .where(eq(glazeColors.id, id));

  revalidatePath("/colors");
  revalidatePath(`/colors/${id}`);
  revalidateTag("colors", "max");
  redirect(`/colors/${id}`);
}

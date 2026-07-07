"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { glazeColors } from "@/db/schema";
import { createColorSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
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
  return { color: result.color };
}

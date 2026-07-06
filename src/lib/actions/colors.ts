"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { glazeColors } from "@/db/schema";
import { createColorSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type FormState = { error?: string };

export async function createColor(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "צריך להתחבר כדי להוסיף צבע" };

  const str = (k: string) => String(formData.get(k) ?? "");

  const parsed = createColorSchema.safeParse({
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

  if (!d.hex && !d.imageUrl) {
    return { error: "צריך להוסיף תמונה או לבחור צבע (hex)" };
  }

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
    .returning({ id: glazeColors.id });

  revalidatePath("/colors");
  redirect(`/colors/${row.id}`);
}

import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "צבע לא תקין (למשל #3f5d78)");

export const createColorSchema = z.object({
  name: z.string().trim().min(1, "חובה להזין שם").max(120),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  code: z.string().trim().max(40).optional().or(z.literal("")),
  hex: hexColor.optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
});
export type CreateColorInput = z.infer<typeof createColorSchema>;

export const mixtureComponentSchema = z.object({
  glazeColorId: z.string().uuid("צבע לא תקין"),
  amount: z
    .number()
    .positive("כמות חייבת להיות חיובית")
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  unit: z
    .enum(["parts", "grams", "%"])
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

export const createMixtureSchema = z.object({
  name: z.string().trim().min(1, "חובה להזין שם לתוצאה").max(120),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  resultImageUrl: z.string().url("חובה להעלות תמונה של התוצאה"),
  resultHex: hexColor.optional().or(z.literal("")),
  components: z
    .array(mixtureComponentSchema)
    .min(2, "צריך לבחור לפחות שני צבעים לערבוב"),
});
export type CreateMixtureInput = z.infer<typeof createMixtureSchema>;

/** Search: color ids + match mode. */
export const searchSchema = z.object({
  colorIds: z.array(z.string().uuid()).min(1),
  mode: z.enum(["all", "any"]).default("all"),
});

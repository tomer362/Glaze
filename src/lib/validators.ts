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

// Editing takes the same fields as creating (image stays optional, so an
// existing image can be kept or replaced).
export const updateColorSchema = createColorSchema;
export type UpdateColorInput = z.infer<typeof updateColorSchema>;

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
  beforeImageUrl: z.string().url().optional().or(z.literal("")),
  beforeHex: hexColor.optional().or(z.literal("")),
  resultImageUrl: z.string().url("חובה להעלות תמונה של התוצאה"),
  resultHex: hexColor.optional().or(z.literal("")),
  components: z
    .array(mixtureComponentSchema)
    .min(1, "צריך לבחור לפחות צבע אחד"),
});
export type CreateMixtureInput = z.infer<typeof createMixtureSchema>;

// Editing reuses the create shape. The edit form pre-fills the existing result
// image into the hidden field, so the required-URL rule keeps holding.
export const updateMixtureSchema = createMixtureSchema;
export type UpdateMixtureInput = z.infer<typeof updateMixtureSchema>;

/** Search: color ids + match mode. */
export const searchSchema = z.object({
  colorIds: z.array(z.string().uuid()).min(1),
  mode: z.enum(["all", "any"]).default("all"),
});

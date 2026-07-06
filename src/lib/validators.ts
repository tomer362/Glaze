import { z } from "zod";
import { UNIT_VALUES } from "./units";

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
    .enum(UNIT_VALUES)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

export const createMixtureSchema = z
  .object({
    name: z.string().trim().min(1, "חובה להזין שם לתוצאה").max(120),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    resultImageUrl: z.string().url("חובה להעלות תמונה של התוצאה"),
    resultHex: hexColor.optional().or(z.literal("")),
    components: z
      .array(mixtureComponentSchema)
      .min(2, "צריך לבחור לפחות שני צבעים לערבוב"),
  })
  .superRefine((data, ctx) => {
    const { components } = data;
    // Amounts are optional overall — validate only once the user records them.
    const anyAmount = components.some((c) => c.amount != null);
    if (!anyAmount) return;

    // When recording amounts, every component must have both amount and unit.
    const incomplete = components.some(
      (c) => c.amount == null || c.unit == null,
    );
    if (incomplete) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["components"],
        message: "צריך להזין כמות ליחידה לכל הצבעים בערבוב",
      });
      return;
    }

    // A single mixture must use one consistent unit.
    const units = new Set(components.map((c) => c.unit));
    if (units.size > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["components"],
        message: "אי אפשר לערבב יחידות מידה שונות באותו ערבוב",
      });
      return;
    }

    // Percentages must add up to exactly 100.
    if (units.has("%")) {
      const sum = components.reduce((acc, c) => acc + (c.amount ?? 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        const rounded = Math.round(sum * 100) / 100;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["components"],
          message: `סכום האחוזים חייב להיות 100% (כרגע ${rounded}%)`,
        });
      }
    }
  });
export type CreateMixtureInput = z.infer<typeof createMixtureSchema>;

/** Search: color ids + match mode. */
export const searchSchema = z.object({
  colorIds: z.array(z.string().uuid()).min(1),
  mode: z.enum(["all", "any"]).default("all"),
});

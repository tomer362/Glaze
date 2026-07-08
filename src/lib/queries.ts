import { db } from "@/db";
import {
  glazeColors,
  mixtures,
  mixtureComponents,
  users,
  type GlazeColor,
} from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

/* ---------------------------------- colors -------------------------------- */

/** The trimmed color shape the client-side pickers actually consume. */
export type ColorOptionRow = {
  id: string;
  name: string;
  brand: string | null;
  code: string | null;
  hex: string | null;
  imageUrl: string | null;
};

/**
 * The full color library, projected to just the 6 fields the mixture/search
 * pickers need, cached across requests. The whole table is shipped into client
 * components on /search, /mixtures/new, and the mixture edit page, so trimming
 * the columns and caching the result (colors change only via the color write
 * actions, which call revalidateTag("colors")) keeps those pages fast as the
 * community library grows.
 */
export const getColorOptions = unstable_cache(
  async (): Promise<ColorOptionRow[]> => {
    return db
      .select({
        id: glazeColors.id,
        name: glazeColors.name,
        brand: glazeColors.brand,
        code: glazeColors.code,
        hex: glazeColors.hex,
        imageUrl: glazeColors.imageUrl,
      })
      .from(glazeColors)
      .orderBy(glazeColors.brand, glazeColors.name);
  },
  ["color-options"],
  { tags: ["colors"], revalidate: 3600 },
);

export async function getColors(
  opts?: { brand?: string; community?: boolean; hideBase?: boolean },
): Promise<GlazeColor[]> {
  const conditions = [];
  if (opts?.brand) conditions.push(eq(glazeColors.brand, opts.brand));
  if (opts?.community) conditions.push(eq(glazeColors.isBase, false));
  if (opts?.hideBase) conditions.push(eq(glazeColors.isBase, false));
  const where = conditions.length ? and(...conditions) : undefined;
  return db
    .select()
    .from(glazeColors)
    .where(where)
    .orderBy(glazeColors.brand, glazeColors.name);
}

export async function getColorById(id: string): Promise<GlazeColor | null> {
  const [row] = await db
    .select()
    .from(glazeColors)
    .where(eq(glazeColors.id, id))
    .limit(1);
  return row ?? null;
}

/** Distinct brand list for the library filter. */
export async function getBrands(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ brand: glazeColors.brand })
    .from(glazeColors)
    .where(sql`${glazeColors.brand} is not null`)
    .orderBy(glazeColors.brand);
  return rows.map((r) => r.brand).filter((b): b is string => b !== null);
}

/* --------------------------------- mixtures ------------------------------- */

export type MixtureComponentView = {
  glazeColorId: string;
  name: string;
  brand: string | null;
  code: string | null;
  hex: string | null;
  imageUrl: string | null;
  amount: number | null;
  unit: string | null;
  position: number;
};

export type MixtureView = {
  id: string;
  name: string;
  notes: string | null;
  beforeImageUrl: string | null;
  beforeHex: string | null;
  resultImageUrl: string | null;
  resultHex: string | null;
  hasAmounts: boolean;
  createdAt: Date;
  createdBy: string;
  authorName: string | null;
  authorImage: string | null;
  components: MixtureComponentView[];
};

type MixtureRow = {
  id: string;
  name: string;
  notes: string | null;
  beforeImageUrl: string | null;
  beforeHex: string | null;
  resultImageUrl: string | null;
  resultHex: string | null;
  hasAmounts: boolean;
  createdAt: Date;
  createdBy: string;
  authorName: string | null;
  authorImage: string | null;
};

/** Load the components (with color info) for a set of mixtures and group them. */
async function attachComponents(rows: MixtureRow[]): Promise<MixtureView[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const comps = await db
    .select({
      mixtureId: mixtureComponents.mixtureId,
      glazeColorId: mixtureComponents.glazeColorId,
      amount: mixtureComponents.amount,
      unit: mixtureComponents.unit,
      position: mixtureComponents.position,
      name: glazeColors.name,
      brand: glazeColors.brand,
      code: glazeColors.code,
      hex: glazeColors.hex,
      imageUrl: glazeColors.imageUrl,
    })
    .from(mixtureComponents)
    .innerJoin(glazeColors, eq(glazeColors.id, mixtureComponents.glazeColorId))
    .where(inArray(mixtureComponents.mixtureId, ids))
    .orderBy(mixtureComponents.position);

  const byMixture = new Map<string, MixtureComponentView[]>();
  for (const c of comps) {
    const list = byMixture.get(c.mixtureId) ?? [];
    list.push({
      glazeColorId: c.glazeColorId,
      name: c.name,
      brand: c.brand,
      code: c.code,
      hex: c.hex,
      imageUrl: c.imageUrl,
      amount: c.amount,
      unit: c.unit,
      position: c.position,
    });
    byMixture.set(c.mixtureId, list);
  }

  return rows.map((r) => ({ ...r, components: byMixture.get(r.id) ?? [] }));
}

const baseMixtureSelect = {
  id: mixtures.id,
  name: mixtures.name,
  notes: mixtures.notes,
  beforeImageUrl: mixtures.beforeImageUrl,
  beforeHex: mixtures.beforeHex,
  resultImageUrl: mixtures.resultImageUrl,
  resultHex: mixtures.resultHex,
  hasAmounts: mixtures.hasAmounts,
  createdAt: mixtures.createdAt,
  createdBy: mixtures.createdBy,
  authorName: users.name,
  authorImage: users.image,
};

export async function getRecentMixtures(limit = 24): Promise<MixtureView[]> {
  const rows = await db
    .select(baseMixtureSelect)
    .from(mixtures)
    .leftJoin(users, eq(users.id, mixtures.createdBy))
    .orderBy(desc(mixtures.createdAt))
    .limit(limit);
  return attachComponents(rows);
}

export async function getMixtureById(id: string): Promise<MixtureView | null> {
  const rows = await db
    .select(baseMixtureSelect)
    .from(mixtures)
    .leftJoin(users, eq(users.id, mixtures.createdBy))
    .where(eq(mixtures.id, id))
    .limit(1);
  const [view] = await attachComponents(rows);
  return view ?? null;
}

/** Mixtures that use a given color (for the color detail page). */
export async function getMixturesForColor(
  colorId: string,
  limit = 60,
): Promise<MixtureView[]> {
  const rows = await db
    .selectDistinct(baseMixtureSelect)
    .from(mixtures)
    .innerJoin(mixtureComponents, eq(mixtureComponents.mixtureId, mixtures.id))
    .leftJoin(users, eq(users.id, mixtures.createdBy))
    .where(eq(mixtureComponents.glazeColorId, colorId))
    .orderBy(desc(mixtures.createdAt))
    .limit(limit);
  return attachComponents(rows);
}

/* --------------------------------- search --------------------------------- */

/**
 * Find mixtures by a set of selected color ids.
 *  - "any": mixtures using at least one selected color
 *  - "all": mixtures using every selected color
 *
 * The "all" query counts how many of the selected colors each mixture matches
 * and keeps only those matching the full set (the unique (mixture, color)
 * constraint means DISTINCT-count == selection size ⇒ contains all).
 */
export async function searchMixtures(
  colorIds: string[],
  mode: "all" | "any",
): Promise<MixtureView[]> {
  if (colorIds.length === 0) return [];

  if (mode === "any") {
    const rows = await db
      .selectDistinct(baseMixtureSelect)
      .from(mixtures)
      .innerJoin(mixtureComponents, eq(mixtureComponents.mixtureId, mixtures.id))
      .leftJoin(users, eq(users.id, mixtures.createdBy))
      .where(inArray(mixtureComponents.glazeColorId, colorIds))
      .orderBy(desc(mixtures.createdAt));
    return attachComponents(rows);
  }

  // mode === "all": GROUP BY mixture, HAVING count(distinct matched) = N
  const matchingIds = await db
    .select({ id: mixtureComponents.mixtureId })
    .from(mixtureComponents)
    .where(inArray(mixtureComponents.glazeColorId, colorIds))
    .groupBy(mixtureComponents.mixtureId)
    .having(
      eq(
        sql<number>`count(distinct ${mixtureComponents.glazeColorId})`,
        colorIds.length,
      ),
    );

  const ids = matchingIds.map((r) => r.id);
  if (ids.length === 0) return [];

  const rows = await db
    .select(baseMixtureSelect)
    .from(mixtures)
    .leftJoin(users, eq(users.id, mixtures.createdBy))
    .where(inArray(mixtures.id, ids))
    .orderBy(desc(mixtures.createdAt));
  return attachComponents(rows);
}

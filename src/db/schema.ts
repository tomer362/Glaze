import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  uuid,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/* -------------------------------------------------------------------------- */
/*  Auth.js core tables (shape expected by @auth/drizzle-adapter, Postgres)    */
/* -------------------------------------------------------------------------- */

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

/* -------------------------------------------------------------------------- */
/*  Domain tables                                                             */
/* -------------------------------------------------------------------------- */

/** A single glaze color: either a seeded library color or a user-uploaded one. */
export const glazeColors = pgTable(
  "glaze_colors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(), // "Blue Rutile" or user free text
    brand: text("brand"), // "AMACO", "Mayco"… null for user custom
    code: text("code"), // "PC-20", nullable
    hex: text("hex"), // approximate swatch "#3f5d78", nullable
    imageUrl: text("image_url"), // Vercel Blob URL of the fired tile; null for seeds
    isBase: boolean("is_base").notNull().default(false), // true = seeded library color
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    // makes seeding idempotent and prevents duplicate catalog entries.
    // Keyed on (brand, name) rather than (brand, code) so the code-less
    // Coyote line also dedupes on re-seed (null codes never conflict).
    // User colors have brand = null, so this never blocks two users from
    // uploading a same-named custom color.
    uniqueIndex("glaze_brand_name_uq").on(t.brand, t.name),
    index("glaze_name_idx").on(t.name),
  ],
);

/** A documented mixture: "I mixed these colors and got this fired result". */
export const mixtures = pgTable(
  "mixtures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    notes: text("notes"),
    resultImageUrl: text("result_image_url"), // fired result photo (Blob)
    resultHex: text("result_hex"), // optional swatch of the result
    hasAmounts: boolean("has_amounts").notNull().default(false), // did the user record ratios?
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("mix_created_by_idx").on(t.createdBy)],
);

/** Join table: which colors went into a mixture, with an optional amount. */
export const mixtureComponents = pgTable(
  "mixture_components",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mixtureId: uuid("mixture_id")
      .notNull()
      .references(() => mixtures.id, { onDelete: "cascade" }),
    glazeColorId: uuid("glaze_color_id")
      .notNull()
      .references(() => glazeColors.id, { onDelete: "restrict" }),
    amount: real("amount"), // nullable — optional ratio / part
    unit: text("unit"), // "parts" | "grams" | "%" — nullable
    position: integer("position").notNull().default(0),
  },
  (t) => [
    // the workhorse index for search: given a color, find its mixtures fast
    index("mc_color_idx").on(t.glazeColorId),
    index("mc_mixture_idx").on(t.mixtureId),
    // no duplicate color in a single mixture — keeps "contains all" counts correct
    uniqueIndex("mc_unique_pair").on(t.mixtureId, t.glazeColorId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Inferred types                                                           */
/* -------------------------------------------------------------------------- */

export type GlazeColor = typeof glazeColors.$inferSelect;
export type NewGlazeColor = typeof glazeColors.$inferInsert;
export type Mixture = typeof mixtures.$inferSelect;
export type NewMixture = typeof mixtures.$inferInsert;
export type MixtureComponent = typeof mixtureComponents.$inferSelect;

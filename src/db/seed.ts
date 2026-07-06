import { config } from "dotenv";

// Load env BEFORE importing the db module (which reads DATABASE_URL at import
// time). Static imports are hoisted, so the db module must be imported
// dynamically, after these calls run.
config({ path: ".env.local" });
config({ path: ".env" });

/**
 * Idempotent seed of the base glaze library. Safe to run repeatedly:
 * `onConflictDoNothing` on the (brand, name) unique index skips rows that
 * already exist, so re-running never creates duplicates.
 */
async function main() {
  const { db } = await import("./index");
  const { glazeColors } = await import("./schema");
  const { seedGlazeColors } = await import("./seed-data/glaze-colors");

  console.log(`Seeding ${seedGlazeColors.length} base glaze colors…`);

  const rows = seedGlazeColors.map((c) => ({
    name: c.name,
    brand: c.brand,
    code: c.code ?? null,
    hex: c.hex ?? null,
    isBase: true,
    createdBy: null,
  }));

  const inserted = await db
    .insert(glazeColors)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: glazeColors.id });

  console.log(
    `Done. Inserted ${inserted.length} new colors (` +
      `${rows.length - inserted.length} already present).`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

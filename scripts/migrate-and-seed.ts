import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { glazeColors } from "../src/db/schema";
import { seedGlazeColors } from "../src/db/seed-data/glaze-colors";

/**
 * Runs at build time (see the "build" script). Applies pending migrations and
 * seeds the base color library, so the whole app can be set up from Vercel
 * without ever opening a terminal.
 *
 * Safe to run on every deploy: migrations are tracked, and the seed uses
 * onConflictDoNothing, so re-runs are no-ops.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn(
      "⚠ DATABASE_URL not set — skipping DB migrate/seed (build continues).",
    );
    return;
  }

  // Dedicated single connection; prepare:false keeps it compatible with the
  // Neon transaction pooler.
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  try {
    console.log("→ Applying database migrations…");
    await migrate(db, { migrationsFolder: "./drizzle" });

    console.log("→ Seeding base glaze colors…");
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
    console.log(`✓ DB ready. Seeded ${inserted.length} new colors.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Database setup failed:", err);
  process.exit(1);
});

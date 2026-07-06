import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load env from .env.local (Vercel pull) then .env, without overriding real env.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});

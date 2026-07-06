import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Provision Neon Postgres on Vercel (Storage tab) " +
      "or set a local Postgres URL in .env.local.",
  );
}

/**
 * A single postgres.js client, reused across hot reloads in dev and across
 * warm serverless invocations in production. Point DATABASE_URL at Neon's
 * *pooled* endpoint on Vercel (`...-pooler...`) so serverless functions share
 * a small connection pool. `prepare: false` keeps prepared statements off,
 * which the transaction pooler requires.
 */
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

const client =
  globalForDb.client ??
  postgres(connectionString, {
    max: 1,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });

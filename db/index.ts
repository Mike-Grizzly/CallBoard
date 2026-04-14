import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Drizzle database client.
 *
 * Uses the Supabase pooler connection string (DATABASE_URL) so it is safe
 * to run in serverless environments like Vercel. We use a single prepared
 * client per module and rely on postgres-js connection pooling.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill in the Supabase pooler connection string.",
  );
}

// `prepare: false` is required when using Supabase's Transaction pooler.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export { schema };

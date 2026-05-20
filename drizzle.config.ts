import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config({ path: ".env.local" });
export default {
  schema: "./db/schema/*",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Scope introspection to the app's own schema. Without this, drizzle-kit
  // scans every schema — including Supabase's managed `auth`/`realtime` — and
  // `db:push` crashes parsing their CHECK constraints.
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
} satisfies Config;

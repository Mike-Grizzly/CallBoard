import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * MVP workflow: `npm run db:push` syncs schema directly to the database.
 * When the schema stabilizes we will switch to generated migration files.
 */
export default {
  schema: "./db/schema/*",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;

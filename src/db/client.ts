import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

const defaultDevUrl = "postgres://talkara:talkara@localhost:5432/talkara";
const url =
  process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0
    ? process.env.DATABASE_URL
    : process.env.NODE_ENV === "production"
      ? null
      : defaultDevUrl;

if (!url) {
  throw new Error('DATABASE_URL is required (set it in ".env")');
}

/** Railway / managed Postgres often require TLS; local Docker typically does not. */
function poolSsl(connectionString: string) {
  if (process.env.PGSSLMODE === "disable") return undefined;
  const local = /localhost|127\.0\.0\.1/.test(connectionString);
  if (local) return undefined;
  if (process.env.DATABASE_SSL === "0") return undefined;
  return { rejectUnauthorized: false as const };
}

export const pool = new Pool({
  connectionString: url,
  ssl: poolSsl(url),
});

export const db = drizzle(pool);


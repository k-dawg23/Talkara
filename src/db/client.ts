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

export const pool = new Pool({
  connectionString: url,
});

export const db = drizzle(pool);


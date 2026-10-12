import "server-only";
import { Pool } from "pg";

let pool: Pool | undefined;
export function tourDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL for private tours.");
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5,
    connectionTimeoutMillis: 5000, query_timeout: 10_000, statement_timeout: 10_000,
  });
  return pool;
}

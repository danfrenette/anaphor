import { getMigrations } from "better-auth/db/migration";
import { tourAuthOptions } from "./auth";
import { tourDatabase } from "./database";

async function migrate() {
 const db = tourDatabase();
 try {
  const migration = await getMigrations(tourAuthOptions());
  await migration.runMigrations();
  await db.query(`CREATE TABLE IF NOT EXISTS anaphor_tour (
    id uuid PRIMARY KEY, owner text NOT NULL, revision integer NOT NULL DEFAULT 1,
    operation_key text NOT NULL, content_hash text NOT NULL, document jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (owner, operation_key)
  )`);
  console.log("Anaphor auth and tour schema ready.");
 } finally { await db.end(); }
}
void migrate().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exitCode = 1;
});

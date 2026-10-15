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
  await db.query(`CREATE TABLE IF NOT EXISTS anaphor_tour_revision (
    tour_id uuid NOT NULL REFERENCES anaphor_tour(id), revision integer NOT NULL,
    document jsonb NOT NULL, PRIMARY KEY (tour_id, revision)
  );
  CREATE TABLE IF NOT EXISTS anaphor_tour_operation (
    owner text NOT NULL, operation_key text NOT NULL, content_hash text NOT NULL,
    result jsonb NOT NULL, PRIMARY KEY (owner, operation_key)
  );
  CREATE TABLE IF NOT EXISTS anaphor_tour_asset (
    owner text NOT NULL, sha256 text NOT NULL, bytes bigint NOT NULL,
    media_type text NOT NULL, storage_key text NOT NULL, PRIMARY KEY (owner, sha256)
  )`);
  console.log("Anaphor auth and tour schema ready.");
 } finally { await db.end(); }
}
void migrate().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exitCode = 1;
});

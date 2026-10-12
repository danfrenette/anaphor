import postgres from "postgres";
import { cache } from "react";
import { validateTour, type TourDocument } from "./document";

declare global {
  var __anaphorTours: {
    sql?: ReturnType<typeof postgres>;
    ready?: Promise<void>;
  } | undefined;
}

function configuredOrigin(value: string | undefined): string | null {
  if (!value) return null;
  const candidate = /^https?:\/\//.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function publicOrigin(request: Request): string {
  const configured = configuredOrigin(process.env.TOUR_PUBLIC_ORIGIN);
  if (configured) return configured;
  const vercel = process.env.VERCEL_ENV === "production"
    ? configuredOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ?? configuredOrigin(process.env.VERCEL_URL)
    : configuredOrigin(process.env.VERCEL_URL);
  if (vercel) return vercel;
  return new URL(request.url).origin;
}

export function tourUrl(request: Request, id: string): string {
  return `${publicOrigin(request)}/tour/${id}`;
}

export async function createTour(document: TourDocument): Promise<string> {
  const db = await database();
  const id = crypto.randomUUID();
  await db`INSERT INTO tours (id, document) VALUES (${id}::uuid, ${db.json(document)})`;
  return id;
}

export const readTour = cache(async function readTour(id: string): Promise<TourDocument | null> {
  const db = await database();
  const rows = await db`SELECT document FROM tours WHERE id = ${id}::uuid`;
  const row = rows[0];
  if (!row) return null;
  const validated = validateTour(row.document, []);
  return validated.ok ? validated.document : null;
});

function state() {
  globalThis.__anaphorTours ??= {};
  return globalThis.__anaphorTours;
}

async function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Tour storage is not configured");
  const current = state();
  if (!current.sql) {
    const local = url.includes("127.0.0.1") || url.includes("localhost");
    current.sql = postgres(url, { max: 1, ssl: local ? false : "require", connect_timeout: 10 });
  }
  if (!current.ready) {
    const pending = current.sql`CREATE TABLE IF NOT EXISTS tours (
      id uuid PRIMARY KEY,
      document jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`.then(() => undefined);
    current.ready = pending;
    pending.catch(() => {
      if (state().ready === pending) state().ready = undefined;
    });
  }
  await current.ready;
  if (!current.sql) throw new Error("Tour storage is not configured");
  return current.sql;
}

import { createHmac, randomUUID } from "node:crypto";
import { Pool } from "pg";

// Substitute only the unavailable external identity boundary. Production has no test-login endpoint.
export async function fictionalIdentity({ provider = "google", accountId = "fixture-google", age = 0, origin = "http://127.0.0.1:3105" } = {}) {
  if (!process.env.TOUR_TEST_DATABASE_URL) throw new Error("An isolated TOUR_TEST_DATABASE_URL is required.");
  const db = new Pool({ connectionString: process.env.TOUR_TEST_DATABASE_URL });
  const userId = randomUUID();
  const token = randomUUID();
  const created = new Date(Date.now() - age);
  const expires = new Date(created.getTime() + 86_400_000);
  try {
    await db.query('INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, true, now(), now())', [userId, "Fictional owner", `${userId}@example.invalid`]);
    await db.query('INSERT INTO account (id, "userId", "providerId", "accountId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, now(), now())', [randomUUID(), userId, provider, accountId]);
    await db.query('INSERT INTO session (id, "userId", token, "createdAt", "updatedAt", "expiresAt", origin, kind) VALUES ($1, $2, $3, $4, $4, $5, $6, $7)', [randomUUID(), userId, token, created, expires, origin, "browser"]);
  } finally { await db.end(); }
  const signature = createHmac("sha256", "fictional-local-test-secret-at-least-32-chars").update(token).digest("base64");
  return { token, cookie: { name: "better-auth.session_token", value: encodeURIComponent(`${token}.${signature}`), url: "http://127.0.0.1:3105", httpOnly: true, sameSite: "Lax" } satisfies { name: string; value: string; url: string; httpOnly: boolean; sameSite: "Lax" } };
}

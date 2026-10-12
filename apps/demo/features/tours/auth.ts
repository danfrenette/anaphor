import "server-only";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { bearer } from "better-auth/plugins/bearer";
import { deviceAuthorization } from "better-auth/plugins/device-authorization";
import { tourDatabase } from "./database";
import { deviceClient, deviceScope, sessionLifetime } from "./document";

export function tourOrigin() {
  const configured = process.env.BETTER_AUTH_URL;
  if (!configured) throw new Error("Configure BETTER_AUTH_URL with this environment's exact origin.");
  const url = new URL(configured);
  if (url.protocol !== "https:" && url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    throw new Error("Private authentication requires HTTPS outside localhost.");
  }
  return url.origin;
}

function allowedAccount(account: { providerId: string; accountId: string }) {
  return (account.providerId === "google" && account.accountId === process.env.ANAPHOR_GOOGLE_OWNER_ID)
    || (account.providerId === "github" && account.accountId === process.env.ANAPHOR_GITHUB_OWNER_ID);
}

async function currentOwner(userId: string) {
  const accounts = await tourDatabase().query<{ providerId: string; accountId: string }>(
    'SELECT "providerId", "accountId" FROM account WHERE "userId" = $1', [userId],
  );
  return accounts.rows.some(allowedAccount);
}

export function tourAuthOptions() {
  const origin = tourOrigin();
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("Configure an environment-specific BETTER_AUTH_SECRET of at least 32 characters.");
  }
  return {
    appName: "Anaphor",
    baseURL: origin,
    secret: process.env.BETTER_AUTH_SECRET,
    database: tourDatabase(),
    trustedOrigins: [origin],
    session: {
      expiresIn: sessionLifetime,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
      additionalFields: {
        origin: { type: "string", required: true, input: false, defaultValue: origin },
        kind: { type: "string", required: true, input: false, defaultValue: "browser" },
      },
    },
    account: { accountLinking: { enabled: true, disableImplicitLinking: true }, storeAccountCookie: false },
    socialProviders: {
      google: { clientId: process.env.GOOGLE_CLIENT_ID ?? "", clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "" },
      github: { clientId: process.env.GITHUB_CLIENT_ID ?? "", clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "" },
    },
    databaseHooks: {
      session: { create: { before: async (session, context) => ({ data: {
        ...session, origin, kind: context?.path === "/device/token" ? "device" : "browser",
      } }) } },
      account: {
        create: { before: async (account: { providerId: string; accountId: string }) => {
          if (!allowedAccount(account)) throw new APIError("FORBIDDEN", { message: "This identity is not authorized for Anaphor." });
          return { data: { ...account, accessToken: null, refreshToken: null, idToken: null } };
        } },
        update: { before: async () => ({ data: { accessToken: null, refreshToken: null, idToken: null } }) },
      },
    },
    hooks: { before: createAuthMiddleware(async (ctx) => {
      if (["/get-access-token", "/refresh-token"].includes(ctx.path)) throw new APIError("FORBIDDEN", { message: "Provider token renewal is disabled. Sign in explicitly." });
      if (["/device", "/device/approve", "/device/deny", "/link-social"].includes(ctx.path)) {
        if (ctx.request?.headers.has("authorization") || ctx.headers?.has("authorization")) throw new APIError("FORBIDDEN", { message: "Use your browser session to explicitly approve or link identities." });
        const session = await getTourAuth().api.getSession({ headers: ctx.headers ?? new Headers() });
        if (!session) throw new APIError("UNAUTHORIZED");
        if (session.session.kind !== "browser" || session.session.origin !== origin || !await currentOwner(session.user.id)) throw new APIError("FORBIDDEN");
      }
      if (ctx.path === "/device/code" && ctx.body?.scope !== deviceScope) {
        throw new APIError("BAD_REQUEST", { message: "Request the Anaphor tour scopes." });
      }
    }) },
    plugins: [bearer(), deviceAuthorization({
      expiresIn: "10m", interval: "5s", verificationUri: `${origin}/tour/device`,
      validateClient: (clientId) => clientId === deviceClient(origin),
    })],
  } satisfies BetterAuthOptions;
}

let auth: ReturnType<typeof betterAuth<ReturnType<typeof tourAuthOptions>>> | undefined;
export function getTourAuth() {
  auth ??= betterAuth(tourAuthOptions());
  return auth;
}

export class PrivateAccessError extends Error {
  constructor(public status: 401 | 403) { super(status === 401 ? "Sign in to continue." : "This identity is not authorized."); }
}

export async function requireTourOwner(headers: Headers) {
  if (!headers.get("cookie") && !headers.get("authorization")) throw new PrivateAccessError(401);
  if (headers.get("host") !== new URL(tourOrigin()).host) throw new PrivateAccessError(403);
  const session = await getTourAuth().api.getSession({ headers });
  if (!session || new Date(session.session.expiresAt).getTime() <= Date.now()
    || Date.now() >= new Date(session.session.createdAt).getTime() + sessionLifetime * 1000) {
    throw new PrivateAccessError(401);
  }
  if (session.session.origin !== tourOrigin() || !await currentOwner(session.user.id)) throw new PrivateAccessError(403);
  return { owner: "dan", expiresAt: new Date(session.session.expiresAt).toISOString() };
}

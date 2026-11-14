import { readFile, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import axios from "axios";
import { secureStore } from "./secure-store";
import { z } from "zod";
import { deviceClient, deviceScope, sessionLifetime, tourDocument } from "./document";

const credentials = z.object({ origin: z.url(), token: z.string().min(1), issuedAt: z.number(), expiresAt: z.number() }).strict();
const tokenResponse = z.object({ access_token: z.string().min(1), token_type: z.literal("Bearer"), expires_in: z.number().positive().max(sessionLifetime), scope: z.literal(deviceScope) });
const codeResponse = z.object({ device_code: z.string(), user_code: z.string(), verification_uri_complete: z.url(), expires_in: z.number().positive().max(600), interval: z.number().positive() });

function argument(args: string[], flag: string) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "local") {
    const { localCli } = await import("./local-cli");
    await localCli(args);
    return;
  }
  const origin = new URL(argument(args, "--origin") ?? process.env.ANAPHOR_ORIGIN ?? "https://anaphor.dev").origin;
  const url = new URL(origin);
  if (url.protocol !== "https:" && !["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("Use HTTPS outside localhost.");
  const http = axios.create({ baseURL: origin, timeout: 15_000, maxRedirects: 0 });

  if (command === "validate") {
    const file = argument(args, "--file");
    if (!file) throw new Error("Supply --file <prepared-document.json>.");
    const parsed = tourDocument.safeParse(JSON.parse(await readFile(file, "utf8")));
    if (!parsed.success) throw new Error(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n"));
    console.log("Valid version 1 tour document.");
    return;
  }
  if (!["login", "logout", "publish"].includes(command ?? "")) throw new Error("Usage: cli.ts login|logout|validate|publish [--origin <origin>] [--file <json>] [--key <idempotency-key>]");
  await secureStore("check", origin);
  if (command === "login") {
    const grant = codeResponse.parse((await http.post("/api/auth/device/code", { client_id: deviceClient(origin), scope: deviceScope })).data);
    if (new URL(grant.verification_uri_complete).origin !== origin) throw new Error("Device approval URL does not match the selected environment.");
    console.log(`Open ${grant.verification_uri_complete}\nConfirm code ${grant.user_code} and explicitly approve the device. This works from a local or remote shell.`);
    const deadline = Date.now() + grant.expires_in * 1000;
    let interval = grant.interval * 1000;
    while (Date.now() < deadline) {
      await new Promise((accept) => setTimeout(accept, Math.min(interval, Math.max(0, deadline - Date.now()))));
      if (Date.now() >= deadline) break;
      try {
        const result = tokenResponse.parse((await http.post("/api/auth/device/token", { grant_type: "urn:ietf:params:oauth:grant-type:device_code", device_code: grant.device_code, client_id: deviceClient(origin) })).data);
        const issuedAt = Date.now();
        const saved = { origin, token: result.access_token, issuedAt, expiresAt: issuedAt + result.expires_in * 1000 };
        try { await secureStore("write", origin, JSON.stringify(saved)); } catch (error) {
          try { await http.post("/api/tours/logout", {}, { headers: { Authorization: `Bearer ${result.access_token}` } }); }
          catch { throw new Error("Secure storage failed and token revocation could not be confirmed. Revoke the device session after recovery."); }
          throw error;
        }
        console.log(`Signed in to ${origin}. Credentials expire within 24 hours; login is required afterward.`);
        return;
      } catch (error) {
        const response = axios.isAxiosError(error) ? error.response?.data : undefined;
        const failure = z.object({ error: z.string() }).safeParse(response);
        if (failure.success && failure.data.error === "authorization_pending") continue;
        if (failure.success && failure.data.error === "slow_down") { interval += 5000; continue; }
        if (axios.isAxiosError(error)) throw new Error("Device login failed or was denied. Run login again after resolving the approval or connectivity issue.");
        throw error;
      }
    }
    throw new Error("Device approval expired. Run login again.");
  }

  let saved: z.infer<typeof credentials>;
  try { saved = credentials.parse(JSON.parse(await secureStore("read", origin))); }
  catch { throw new Error("Stored credentials are unavailable or invalid. Check the secure store for this origin and log in again."); }
  if (saved.origin !== origin || saved.expiresAt > saved.issuedAt + sessionLifetime * 1000) throw new Error("Credential origin or lifetime does not match this environment. Log in again.");
  http.defaults.headers.common.Authorization = `Bearer ${saved.token}`;
  if (command === "logout") {
    try { await http.post("/api/tours/logout", {}); } catch (error) {
      if (!(axios.isAxiosError(error) && error.response?.status === 401)) throw new Error("Session revocation could not be confirmed. Credentials remain in the secure store; retry logout after recovery.");
    }
    try { await secureStore("delete", origin); } catch { throw new Error("Server session revoked, but secure-store cleanup failed. Remove the Anaphor entry from your keyring or secure store."); }
    console.log("Signed out and removed secure-store credentials.");
    return;
  }
  if (Date.now() >= saved.expiresAt) throw new Error("Credentials expired. Keep your prepared document and operation key, run login, then resume publication.");
  const file = argument(args, "--file");
  const key = argument(args, "--key");
  if (!file || !key) throw new Error("Publication requires --file and --key. Preserve the same key for an unchanged uncertain-response retry.");
  const path = resolve(file);
  if ((await stat(path)).mode & 0o077) throw new Error("Protect the prepared document with owner-only file permissions (chmod 600).");
  for (let parent = dirname(path); ; parent = dirname(parent)) {
    const git = resolve(parent, ".git");
    const marker = await stat(git).catch(() => null);
    if (marker?.isFile() || (marker?.isDirectory() && await stat(resolve(git, "HEAD")).catch(() => null))) {
      throw new Error("Keep prepared tours outside product repositories.");
    }
    if (parent === dirname(parent)) break;
  }
  try {
    const { publishHostedTour } = await import("./hosted-cli");
    const expected = argument(args, "--expected-revision");
    const result = await publishHostedTour(http, path, key, { id: argument(args, "--id"), expectedRevision: expected ? Number(expected) : undefined });
    console.log(JSON.stringify(result));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status && [400, 413, 422].includes(status)) {
        const failure = z.object({ error: z.string(), diagnostics: z.array(z.object({ path: z.array(z.union([z.string(), z.number()])), message: z.string() })).optional() }).safeParse(error.response?.data);
        throw new Error(failure.success ? [failure.data.error, ...(failure.data.diagnostics ?? []).map((issue) => `${issue.path.join(".")}: ${issue.message}`)].join("\n") : "Publication rejected this document. Validate and correct it before retrying.");
      }
      throw new Error(`Publication ${status ? `returned ${status}` : "has an uncertain response"}. Prepared content is retained. ${status === 401 ? "Run login before resuming." : status === 409 ? "Inspect the original operation before changing the key or document." : "Retry unchanged content with the same operation key after recovery."}`);
    }
    throw error;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof z.ZodError ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n") : error instanceof Error ? error.message : "Anaphor CLI failed.");
  process.exitCode = 1;
});

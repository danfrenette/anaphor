import { timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { cache } from "react";

export const sessionCookieName = "anaphor_tour_session";
export const oauthCookieName = "anaphor_tour_oauth_state";
const sessionSeconds = 60 * 60 * 24 * 14;
const loginPattern = /^[A-Za-z0-9-]{1,39}$/;

export type Principal =
  | { kind: "agent" }
  | { kind: "session"; login: string }
  | { kind: "anonymous" };

export type Access = "allowed" | "unauthenticated" | "forbidden";

type Session = { login: string; exp: number };
type OauthState = { nonce: string; returnTo: string; exp: number };

export function ownerLogin(): string {
  return process.env.TOUR_OWNER_LOGIN || "danfrenette";
}

export function configuredSecrets(): string[] {
  return [process.env.TOUR_AGENT_TOKEN, process.env.TOUR_SESSION_SECRET, process.env.GITHUB_CLIENT_SECRET].filter(
    (value): value is string => typeof value === "string" && value.length >= 16,
  );
}

export function testIdentityEnabled(): boolean {
  if (process.env.TOUR_IDENTITY_ADAPTER !== "test") return false;
  const vercel = process.env.VERCEL_ENV;
  return vercel !== "production" && vercel !== "preview";
}

export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function isTourId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function safeTourPath(value: string | null): string {
  if (!value) return "/";
  const id = value.startsWith("/tour/") ? value.slice("/tour/".length) : "";
  if (!isTourId(id) || value !== `/tour/${id}`) return "/";
  return `/tour/${id.toLowerCase()}`;
}

export function accessFor(principal: Principal): Access {
  if (principal.kind === "anonymous") return "unauthenticated";
  if (principal.kind === "agent" || principal.login === ownerLogin()) return "allowed";
  return "forbidden";
}

export const currentPrincipal = cache(async function currentPrincipal(): Promise<Principal> {
  const authorization = (await headers()).get("authorization");
  if (authorization !== null) return authorization.startsWith("Bearer ") && isAgentToken(authorization.slice("Bearer ".length)) ? { kind: "agent" } : { kind: "anonymous" };
  const session = await readSession();
  return session ? { kind: "session", login: session.login } : { kind: "anonymous" };
});

export async function sessionCookie(login: string, secure: boolean) {
  const secret = sessionSecret();
  if (!secret || !loginPattern.test(login)) return null;
  const payload = encodeJson({ login, exp: Math.floor(Date.now() / 1000) + sessionSeconds });
  return { name: sessionCookieName, value: `${payload}.${await sign(payload, secret)}`, options: cookieOptions(secure, sessionSeconds) };
}

export async function oauthStateCookie(state: { nonce: string; returnTo: string }, secure: boolean) {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload = encodeJson({ ...state, exp: Math.floor(Date.now() / 1000) + 600 });
  return { name: oauthCookieName, value: `${payload}.${await sign(payload, secret)}`, options: cookieOptions(secure, 600) };
}

export async function readOauthState(): Promise<OauthState | null> {
  const value = (await cookies()).get(oauthCookieName)?.value;
  const decoded = value ? await decodeSigned<OauthState>(value, isOauthState) : null;
  return decoded;
}

function isAgentToken(presented: string): boolean {
  const expected = process.env.TOUR_AGENT_TOKEN;
  if (!expected || expected.length < 16 || presented.length === 0 || /\s/.test(presented)) return false;
  return safeEqual(presented, expected);
}

async function readSession(): Promise<Session | null> {
  const value = (await cookies()).get(sessionCookieName)?.value;
  return value ? decodeSigned(value, isSession) : null;
}

function sessionSecret(): string | null {
  const secret = process.env.TOUR_SESSION_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

function cookieOptions(secure: boolean, maxAge: number) {
  const sameSite: "lax" | "strict" | "none" = "lax";
  return { httpOnly: true, sameSite, secure, path: "/", maxAge };
}

function encodeJson(value: Session | OauthState): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function decodeSigned<T>(value: string, accept: (parsed: unknown) => T | null): Promise<T | null> {
  const secret = sessionSecret();
  const separator = value.lastIndexOf(".");
  if (!secret || separator <= 0) return null;
  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = await sign(payload, secret);
  if (!safeEqual(signature, expected)) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const result = accept(parsed);
    if (!result || !isRecord(parsed) || typeof parsed.exp !== "number" || parsed.exp <= Date.now() / 1000) return null;
    return result;
  } catch {
    return null;
  }
}

function isSession(parsed: unknown): Session | null {
  if (!isRecord(parsed) || typeof parsed.login !== "string" || !loginPattern.test(parsed.login) || typeof parsed.exp !== "number") return null;
  return { login: parsed.login, exp: parsed.exp };
}

function isOauthState(parsed: unknown): OauthState | null {
  if (!isRecord(parsed) || typeof parsed.nonce !== "string" || typeof parsed.returnTo !== "string" || typeof parsed.exp !== "number") return null;
  return { nonce: parsed.nonce, returnTo: safeTourPath(parsed.returnTo), exp: parsed.exp };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function safeEqual(left: string, right: string): boolean {
  const encodedLeft = new TextEncoder().encode(left);
  const encodedRight = new TextEncoder().encode(right);
  if (encodedLeft.byteLength !== encodedRight.byteLength) return false;
  return timingSafeEqual(encodedLeft, encodedRight);
}

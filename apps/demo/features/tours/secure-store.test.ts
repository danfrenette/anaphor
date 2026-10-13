// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { secureStore } from "./secure-store";

const keychain = vi.hoisted(() => ({ entries: new Map<string, string>(), denied: false }));
vi.mock("@napi-rs/keyring", () => ({
  AsyncEntry: class {
    private key: string;
    constructor(service: string, account: string) { this.key = `${service}:${account}`; }
    async getPassword() {
      if (keychain.denied) throw new Error("sensitive native diagnostic");
      return keychain.entries.get(this.key) ?? null;
    }
    async setPassword(value: string) {
      if (keychain.denied) throw new Error("sensitive native diagnostic");
      keychain.entries.set(this.key, value);
    }
    async deletePassword() {
      if (keychain.denied) throw new Error("sensitive native diagnostic");
      return keychain.entries.delete(this.key);
    }
  },
}));

const platform = Object.getOwnPropertyDescriptor(process, "platform")!;
beforeEach(() => {
  vi.stubEnv("ANAPHOR_SECURE_STORE", "");
  Object.defineProperty(process, "platform", { value: "darwin" });
  keychain.entries.clear();
  keychain.denied = false;
});
afterEach(() => {
  Object.defineProperty(process, "platform", platform);
  vi.unstubAllEnvs();
});

test("macOS credentials stay isolated by origin and can be replaced and removed without a helper", async () => {
  const first = "https://first.example";
  const second = "https://second.example";
  await secureStore("check", first);
  await secureStore("write", first, "fictional-first");
  await secureStore("write", second, "fictional-second");
  await secureStore("write", first, "fictional-replacement");
  expect(await secureStore("read", first)).toBe("fictional-replacement");
  expect(await secureStore("read", second)).toBe("fictional-second");
  await secureStore("delete", first);
  await secureStore("delete", first);
  await expect(secureStore("read", first)).rejects.toThrow(/not found/i);
  expect(await secureStore("read", second)).toBe("fictional-second");
});

test("denied Keychain operations report safe recovery guidance without leaking native diagnostics", async () => {
  keychain.denied = true;
  for (const action of ["check", "read", "write", "delete"] as const) {
    await expect(secureStore(action, "https://denied.example", "fictional-secret"))
      .rejects.toThrow("macOS Keychain access failed");
    await expect(secureStore(action, "https://denied.example", "fictional-secret"))
      .rejects.not.toThrow("sensitive native diagnostic");
  }
});

test("an explicit helper override takes precedence over the built-in macOS adapter", async () => {
  vi.stubEnv("ANAPHOR_SECURE_STORE", "relative-helper");
  await expect(secureStore("write", "https://override.example", "fictional-secret"))
    .rejects.toThrow("absolute executable path");
  expect(keychain.entries.size).toBe(0);
});

// @vitest-environment node
import { randomUUID } from "node:crypto";
import { expect, test, vi } from "vitest";
import { secureStore } from "./secure-store";

// Explicitly opted in: the OS may request access to the user's login keychain.
test.skipIf(process.platform !== "darwin" || process.env.ANAPHOR_TEST_KEYCHAIN !== "1")(
  "the built-in macOS adapter persists, isolates and removes disposable credentials",
  async () => {
    vi.stubEnv("ANAPHOR_SECURE_STORE", "");
    const first = `https://${randomUUID()}.keychain-test.invalid`;
    const second = `https://${randomUUID()}.keychain-test.invalid`;
    try {
      await secureStore("check", first);
      await secureStore("write", first, "fictional-original");
      await secureStore("write", second, "fictional-other-origin");
      await secureStore("write", first, "fictional-replacement");
      expect(await secureStore("read", first)).toBe("fictional-replacement");
      expect(await secureStore("read", second)).toBe("fictional-other-origin");
      await secureStore("delete", first);
      await secureStore("delete", first);
      await expect(secureStore("read", first)).rejects.toThrow("Credentials not found");
      expect(await secureStore("read", second)).toBe("fictional-other-origin");
    } finally {
      try {
        await secureStore("delete", first);
      } finally {
        try { await secureStore("delete", second); }
        finally { vi.unstubAllEnvs(); }
      }
    }
  },
);

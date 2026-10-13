import type { SecureStoreAction } from "./secure-store";

/** Native code loads only on macOS; other platforms keep their existing stores. */
export async function macosKeychain(action: SecureStoreAction, origin: string, value: string) {
  let stored: string | null = null;
  try {
    const { AsyncEntry } = await import("@napi-rs/keyring");
    const entry = new AsyncEntry("dev.anaphor.private-tours", origin);
    switch (action) {
      case "check":
        await entry.getPassword();
        return "";
      case "read":
        stored = await entry.getPassword();
        break;
      case "write":
        await entry.setPassword(value);
        return "";
      case "delete":
        await entry.deletePassword();
        return "";
    }
  } catch {
    // Native diagnostics may contain credential data. Never forward them to the terminal.
    throw new Error("macOS Keychain access failed. Unlock your login keychain and allow access when prompted. If the native module is missing, reinstall workspace dependencies. No plaintext fallback is used.");
  }
  if (stored === null) throw new Error("Credentials not found in macOS Keychain for this origin. Run login.");
  return stored;
}

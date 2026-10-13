import { spawn } from "node:child_process";
import { macosKeychain } from "./macos-keychain";

export type SecureStoreAction = "check" | "read" | "write" | "delete";

function execute(file: string, args: string[], input = "") {
  return new Promise<string>((accept, reject) => {
    const child = spawn(file, args, { stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (output.length > 65_536) child.kill();
    });
    child.stderr.resume();
    child.on("error", () => reject(new Error(
      "Secure credential storage is unavailable. Check ANAPHOR_SECURE_STORE or the installed OS keyring tooling. No plaintext fallback is used.",
    )));
    child.on("close", (code) => code === 0
      ? accept(output.trim())
      : reject(new Error("Secure credential storage failed. Check the helper and unlocked keyring. No plaintext fallback is used.")));
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

/** Storage only: callers own credential validation and server revocation. */
export async function secureStore(action: SecureStoreAction, origin: string, value = "") {
  const helper = process.env.ANAPHOR_SECURE_STORE;
  if (helper) {
    if (!helper.startsWith("/")) throw new Error("ANAPHOR_SECURE_STORE must be an absolute executable path.");
    return execute(helper, [action, origin], value);
  }
  if (process.platform === "darwin") return macosKeychain(action, origin, value);
  if (process.platform !== "linux") {
    throw new Error("Configure ANAPHOR_SECURE_STORE for this OS keyring or remote secret store. No plaintext fallback is used.");
  }
  if (action === "check") return execute("secret-tool", ["store", "--help"]);
  const attributes = ["application", "anaphor", "origin", origin];
  if (action === "write") {
    return execute("secret-tool", ["store", "--label=Anaphor private tours", ...attributes], value);
  }
  return execute("secret-tool", [action === "read" ? "lookup" : "clear", ...attributes]);
}

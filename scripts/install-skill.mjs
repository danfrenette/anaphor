import { lstat, mkdir, realpath, symlink } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === "--help") {
  console.log("Usage: node scripts/install-skill.mjs [--destination <skill-directory>]");
  console.log("Default: ~/.agents/skills/anaphor (a live link to this checkout)");
} else {
  try {
    if (args.length !== 0 && !(args.length === 2 && args[0] === "--destination" && args[1])) {
      throw new Error("Use --help for installation options.");
    }

    const source = await realpath(fileURLToPath(new URL("../skills/anaphor", import.meta.url)));
    const destination = resolve(args[1] ?? resolve(homedir(), ".agents/skills/anaphor"));
    const existing = await lstat(destination).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });

    if (existing) {
      const target = existing.isSymbolicLink()
        ? await realpath(destination).catch((error) => {
            if (error.code === "ENOENT") return null;
            throw error;
          })
        : null;
      if (target !== source) {
        throw new Error(`Destination already exists; nothing replaced: ${destination}`);
      }
      console.log(`Already installed: ${destination}`);
    } else {
      await mkdir(dirname(destination), { recursive: true });
      await symlink(source, destination, process.platform === "win32" ? "junction" : "dir");
      console.log(`Installed: ${destination} -> ${source}`);
    }
    console.log("Reopen your agent session and confirm anaphor is available, then use $anaphor.");
    console.log("Keep this checkout in place: the installation follows its local changes.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

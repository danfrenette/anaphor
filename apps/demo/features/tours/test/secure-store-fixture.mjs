#!/usr/bin/env node
// Fictional acceptance adapter only. This is not secure storage for real credentials.
import { readFile, writeFile, unlink } from "node:fs/promises";
const [action] = process.argv.slice(2);
const path = process.env.ANAPHOR_TEST_CREDENTIAL_FILE;
if (!path) process.exit(1);
if (process.env.ANAPHOR_TEST_STORE_FAIL === action) process.exit(1);
if (action === "check") process.exit(0);
if (action === "read") process.stdout.write(await readFile(path, "utf8"));
else if (action === "write") {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  await writeFile(path, input, { mode: 0o600 });
} else if (action === "delete") await unlink(path);
else process.exit(1);

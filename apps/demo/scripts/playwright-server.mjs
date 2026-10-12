import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const port = 54329;
const db = await PGlite.create();
const database = new PGLiteSocketServer({ db, port, host: "127.0.0.1" });
await database.start();

const env = {
  ...process.env,
  DATABASE_URL: `postgres://postgres:postgres@127.0.0.1:${port}/postgres`,
};

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", args, { cwd: repoRoot, env, stdio: "inherit" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`pnpm ${args.join(" ")} exited ${code}`))));
  });
}

await run(["--filter", "@anaphor/demo", "exec", "next", "build"]);

const nextCli = path.join(repoRoot, "apps/demo/node_modules/next/dist/bin/next");
const next = spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", "3105"], {
  cwd: path.join(repoRoot, "apps/demo"),
  env,
  stdio: "inherit",
});

function shutdown(code = 0) {
  if (!next.killed) next.kill("SIGTERM");
  process.exit(code);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(0));
}
next.on("exit", (code) => {
  process.exit(code ?? 1);
});

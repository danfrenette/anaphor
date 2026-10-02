import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("./install-skill.mjs", import.meta.url));
const source = fileURLToPath(new URL("../skills/anaphor", import.meta.url));
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8", cwd: tmpdir() });

test("installs the full skill from any working directory and safely repeats", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "anaphor-skill-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const destination = join(root, "skills with spaces", "anaphor");
  assert.equal(run("--destination", destination).status, 0);
  assert.equal(await realpath(destination), await realpath(source));
  for (const file of ["SKILL.md", "paper.md", "implementation.md"]) {
    assert.equal(await readFile(join(destination, file), "utf8"), await readFile(join(source, file), "utf8"));
  }
  assert.equal(run("--destination", destination).status, 0);
});

test("preserves existing files, directories, and broken links", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "anaphor-skill-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = join(root, "file");
  const directory = join(root, "directory");
  const link = join(root, "link");
  await writeFile(file, "user-owned");
  await mkdir(directory);
  await writeFile(join(directory, "SKILL.md"), "custom skill");
  await symlink(join(root, "missing"), link, "dir");
  for (const destination of [file, directory, link]) {
    const result = run("--destination", destination);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /nothing replaced/);
  }
  assert.equal(await readFile(file, "utf8"), "user-owned");
  assert.equal(await readFile(join(directory, "SKILL.md"), "utf8"), "custom skill");
});

test("supports help and rejects malformed arguments", () => {
  assert.equal(run("--help").status, 0);
  assert.equal(run("--destination").status, 1);
  assert.equal(run("--force").status, 1);
});

// @vitest-environment node
import { mkdtemp, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { afterEach, expect, test } from "vitest";

const scratch: string[] = [];
afterEach(async () => { await Promise.all(scratch.splice(0).map((path) => rm(path, { recursive: true, force: true }))); });
const document = { version: 2, title: "Local tour", overview: "Prove local authoring.", prs: [{ url: "https://github.com/example/app/pull/1", base: "a".repeat(40), head: "b".repeat(40) }], sections: [{ id: "local", title: "Local loading", paragraphs: ["A local tour opens without authentication."] }], evidence: [], assets: [] };
function cli(workspace: string, args: string[]) {
  return execFileSync(process.execPath, ["--import", resolve("apps/demo/node_modules/tsx/dist/loader.mjs"), resolve("apps/demo/features/tours/cli.ts"), "local", ...args], { env: { ...process.env, ANAPHOR_WORKSPACE: workspace, ANAPHOR_ORIGIN: "invalid" }, encoding: "utf8" });
}
test("an author imports and reopens a version 2 tour without hosted configuration", async () => {
  const directory = await mkdtemp(join(tmpdir(), "anaphor-cli-")); scratch.push(directory);
  const file = join(directory, "bundle.json");
  await writeFile(file, JSON.stringify({ document, files: {} }));
  const result = JSON.parse(cli(join(directory, "workspace"), ["import", "--file", file]));
  expect(result.revision).toBe(1);
  expect(result.url).toBe(`http://127.0.0.1:3017/local-tour/${result.id}`);
  const reopened = JSON.parse(cli(join(directory, "workspace"), ["preview", "--id", result.id]));
  expect(reopened).toEqual(result);
});

test("a PR keeps one tour identity and conflicting or invalid updates leave its readable revision intact", async () => {
  const directory = await mkdtemp(join(tmpdir(), "anaphor-cli-")); scratch.push(directory);
  const file = join(directory, "bundle.json"); const workspace = join(directory, "workspace");
  await writeFile(file, JSON.stringify({ document, files: {} }));
  const first = JSON.parse(cli(workspace, ["import", "--file", file]));
  expect(() => cli(workspace, ["import", "--file", file])).toThrow(/Revision conflict/);
  await writeFile(file, JSON.stringify({ document: { ...document, title: "Updated local tour" }, files: {} }));
  const next = JSON.parse(cli(workspace, ["import", "--expected-revision", "1", "--file", file]));
  expect(next.id).toBe(first.id); expect(next.revision).toBe(2);
  expect(() => cli(workspace, ["update", "--id", first.id, "--expected-revision", "1", "--file", file])).toThrow(/Revision conflict/);
  await writeFile(file, JSON.stringify({ document: { ...document, version: 9 }, files: {} }));
  expect(() => cli(workspace, ["update", "--id", first.id, "--expected-revision", "2", "--file", file])).toThrow();
  expect(JSON.parse(cli(workspace, ["preview", "--id", first.id]))).toEqual(next);
});

test("validation reports missing required criteria as merge concerns instead of claiming readiness", async () => {
  const directory = await mkdtemp(join(tmpdir(), "anaphor-cli-")); scratch.push(directory);
  const file = join(directory, "bundle.json");
  await writeFile(file, JSON.stringify({ document, files: {} }));
  const result = JSON.parse(cli(join(directory, "workspace"), ["validate", "--file", file]));
  expect(result.valid).toBe(true);
  expect(result.concerns).toContain("No required verification evidence is recorded.");
});

test("new heads retain original runs and a rerun gets its own evidence ID", async () => {
  const directory = await mkdtemp(join(tmpdir(), "anaphor-cli-")); scratch.push(directory);
  const file = join(directory, "bundle.json"); const workspace = join(directory, "workspace");
  const evidence = { id: "original-run", criterion: "T4", expected: "Local updates retain runs", observed: "Passed", action: "Run CLI test", result: "pass", target: "Local CLI", context: "Fictional repository", testedAt: "2026-10-14T20:00:00Z", required: true, assetIds: [], sources: [{ pr: document.prs[0]!.url, head: document.prs[0]!.head }], assessments: [] };
  const tested = { ...document, sections: [{ ...document.sections[0], evidenceIds: [evidence.id] }], evidence: [evidence] };
  await writeFile(file, JSON.stringify({ document: tested, files: {} }));
  const first = JSON.parse(cli(workspace, ["import", "--file", file]));
  const next = { ...tested, prs: [{ ...document.prs[0], head: "c".repeat(40) }] };
  await writeFile(file, JSON.stringify({ document: next, files: {} }));
  cli(workspace, ["update", "--id", first.id, "--expected-revision", "1", "--file", file]);
  const report = JSON.parse(cli(workspace, ["validate", "--file", file]));
  expect(report.concerns).toContain("T4: stale evidence.");
  await writeFile(file, JSON.stringify({ document: { ...next, evidence: [{ ...evidence, sources: [{ pr: document.prs[0]!.url, head: "c".repeat(40) }] }] }, files: {} }));
  expect(() => cli(workspace, ["update", "--id", first.id, "--expected-revision", "2", "--file", file])).toThrow(/immutable/);
  const rerun = { ...evidence, id: "rerun", supersedes: evidence.id, sources: [{ pr: document.prs[0]!.url, head: "c".repeat(40) }] };
  await writeFile(file, JSON.stringify({ document: { ...next, sections: [{ ...tested.sections[0], evidenceIds: [rerun.id] }], evidence: [evidence, rerun] }, files: {} }));
  const updated = JSON.parse(cli(workspace, ["update", "--id", first.id, "--expected-revision", "2", "--file", file]));
  expect(updated.revision).toBe(3);
  expect(JSON.parse(cli(workspace, ["validate", "--file", file])).concerns).toEqual([]);
});

test("managed receipts survive removal of their source bundle and escaped or corrupt assets are rejected", async () => {
  const directory = await mkdtemp(join(tmpdir(), "anaphor-cli-")); scratch.push(directory);
  const source = join(directory, "source"); const workspace = join(directory, "workspace");
  const { mkdir } = await import("node:fs/promises"); await mkdir(source);
  const bytes = Buffer.from("Observed verification output\n");
  const asset = { id: "receipt", mediaType: "text/plain", sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length, description: "CLI receipt", caption: "Executed check output", provenance: "CLI verification on pinned head" };
  await writeFile(join(source, "receipt.txt"), bytes);
  const file = join(source, "bundle.json"); const prepared = { document: { ...document, assets: [asset] }, files: { receipt: "receipt.txt" } };
  await writeFile(file, JSON.stringify(prepared));
  const imported = JSON.parse(cli(workspace, ["import", "--file", file]));
  await writeFile(join(source, "receipt.txt"), "Changed after capture");
  expect(() => cli(workspace, ["validate", "--file", file])).toThrow(/SHA-256/);
  await writeFile(join(directory, "outside.txt"), bytes);
  await symlink(join(directory, "outside.txt"), join(source, "escape.txt"));
  await writeFile(file, JSON.stringify({ ...prepared, files: { receipt: "escape.txt" } }));
  expect(() => cli(workspace, ["validate", "--file", file])).toThrow(/escapes/);
  await rm(source, { recursive: true });
  expect(JSON.parse(cli(workspace, ["preview", "--id", imported.id]))).toEqual(imported);
});

test("an unrelated optional run cannot supersede required evidence to hide a failed check", async () => {
  const directory = await mkdtemp(join(tmpdir(), "anaphor-cli-")); scratch.push(directory);
  const file = join(directory, "bundle.json");
  const required = { id: "required", criterion: "T4", expected: "Persistence works", observed: "Failed", action: "Run persistence test", result: "fail", target: "CLI", context: "Test workspace", testedAt: "2026-10-14T20:00:00Z", required: true, sources: [{ pr: document.prs[0]!.url, head: document.prs[0]!.head }] };
  const optional = { ...required, id: "optional", criterion: "T1", required: false, result: "pass", supersedes: "required" };
  await writeFile(file, JSON.stringify({ document: { ...document, evidence: [required, optional] }, files: {} }));
  expect(() => cli(join(directory, "workspace"), ["validate", "--file", file])).toThrow(/Superseding evidence/);
});

test("existing version 1 text tours remain valid and can use local previews", async () => {
  const directory = await mkdtemp(join(tmpdir(), "anaphor-cli-")); scratch.push(directory);
  const file = join(directory, "bundle.json");
  const legacy = { version: 1, title: document.title, overview: document.overview, prs: document.prs, sections: document.sections };
  await writeFile(file, JSON.stringify({ document: legacy, files: {} }));
  const report = JSON.parse(cli(join(directory, "workspace"), ["validate", "--file", file]));
  expect(report.version).toBe(1);
  const result = JSON.parse(cli(join(directory, "workspace"), ["import", "--file", file]));
  expect(result.revision).toBe(1);
});

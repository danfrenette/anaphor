import { validateAssetBytes, validateTourUpdate } from "./bundle-validation";
export { validateAssetBytes, validateTourUpdate } from "./bundle-validation";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { mkdir, readFile, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { z } from "zod";
import { tourDocument } from "./document";

export function localWorkspace() {
  const applicationData = process.platform === "darwin" ? join(homedir(), "Library", "Application Support")
    : process.platform === "win32" ? process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local")
    : process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
  // The user workspace is runtime data outside the application deployment.
  return resolve(/* turbopackIgnore: true */ process.env.ANAPHOR_TOUR_WORKSPACE ?? process.env.ANAPHOR_WORKSPACE ?? join(applicationData, "Anaphor", "tours"));
}
const uuid = z.uuid();
const stored = z.object({ id: uuid, revision: z.number().int().positive(), document: tourDocument }).strict();
export type LocalTour = z.infer<typeof stored>;
export const preparedBundle = z.object({ document: tourDocument, files: z.record(z.string(), z.string()) }).strict();

async function contained(root: string, path: string) {
  const [base, target] = await Promise.all([realpath(root), realpath(path)]);
  const offset = relative(base, target);
  if (offset === ".." || offset.startsWith(`..${sep}`) || isAbsolute(offset)) throw new Error("Path or symlink escapes its registered workspace.");
  return target;
}
export async function validatePreparedBundle(file: string) {
  const path = resolve(file);
  if ((await stat(path)).size > 1_100_000) throw new Error("Prepared bundle exceeds 1 MiB. Keep media outside JSON.");
  const bundle = preparedBundle.parse(JSON.parse(await readFile(path, "utf8")));
  const assets = new Map<string, Buffer>();
  const declaredAssets = bundle.document.version === 2 ? bundle.document.assets : [];
  if (declaredAssets.reduce((total, asset) => total + asset.bytes, 0) > 500 * 1024 * 1024) throw new Error("Bundle assets exceed 500 MiB total.");
  let actualBytes = 0;
  if (bundle.document.version === 2) for (const asset of bundle.document.assets) {
    const source = bundle.files[asset.id];
    if (!source || isAbsolute(source)) throw new Error(`Asset ${asset.id}: supply a relative file in the bundle files manifest.`);
    const target = await contained(dirname(path), resolve(dirname(path), source));
    const size = (await stat(target)).size;
    if (size > 100 * 1024 * 1024) throw new Error(`Asset ${asset.id} exceeds 100 MiB.`);
    if (size !== asset.bytes) throw new Error(`Asset ${asset.id}: byte count or SHA-256 does not match.`);
    actualBytes += size;
    if (actualBytes > 500 * 1024 * 1024) throw new Error("Bundle assets exceed 500 MiB total.");
    const bytes = await readFile(target);
    validateAssetBytes(asset, bytes);
    assets.set(asset.id, bytes);
  }
  if (Object.keys(bundle.files).some((id) => !assets.has(id))) throw new Error("Bundle files contains an unregistered asset ID.");
  return { document: bundle.document, assets };
}
async function tourDirectory(id: string) {
  uuid.parse(id);
  const root = localWorkspace();
  return contained(root, join(root, id));
}
export async function readLocalTour(id: string, revision?: number): Promise<LocalTour> {
  const directory = await tourDirectory(id);
  const selected = revision ?? z.number().int().positive().parse(JSON.parse(await readFile(await contained(directory, join(directory, "current.json")), "utf8")));
  z.number().int().positive().parse(selected);
  return stored.parse(JSON.parse(await readFile(await contained(directory, join(directory, `revision-${selected}`, "document.json")), "utf8")));
}
export async function readLocalAsset(id: string, revision: number, assetId: string) {
  const tour = await readLocalTour(id, revision);
  const asset = tour.document.version === 2 ? tour.document.assets.find((item) => item.id === assetId) : undefined;
  if (!asset) throw new Error("Registered tour asset not found.");
  const directory = await tourDirectory(id);
  const bytes = await readFile(await contained(directory, join(directory, `revision-${revision}`, "assets", asset.id)));
  validateAssetBytes(asset, bytes);
  return { asset, bytes };
}
export async function writeLocalTour(file: string, options: { id?: string; expectedRevision?: number } = {}) {
  const bundle = await validatePreparedBundle(file);
  const root = localWorkspace();
  await mkdir(root, { recursive: true, mode: 0o700 });
  for (let parent = await realpath(/* turbopackIgnore: true */ root); ; parent = dirname(parent)) {
    if (await stat(join(parent, ".git")).catch(() => null)) throw new Error("Keep the Anaphor workspace outside product repositories.");
    if (parent === dirname(parent)) break;
  }
  const lock = join(root, ".write-lock");
  try { await mkdir(lock, { mode: 0o700 }); } catch { throw new Error("Workspace is being updated. Retry after the other writer completes; inspect .write-lock if its process was interrupted."); }
  try {
    const tours: LocalTour[] = [];
    for (const item of await readdir(/* turbopackIgnore: true */ root)) if (uuid.safeParse(item).success) {
      try { tours.push(await readLocalTour(item)); }
      catch (error) {
        // A process can stop before publishing a newly created tour's first pointer.
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      }
    }
    const associated = tours.filter((item) => item.document.prs.some((pr) => bundle.document.prs.some((next) => next.url === pr.url)));
    if (associated.length > 1) throw new Error("Participating PRs belong to different tours. Resolve their associations before updating.");
    const previous = options.id ? await readLocalTour(options.id) : associated[0];
    if (associated[0] && previous?.id !== associated[0].id) throw new Error("A participating PR is already associated with another tour.");
    if (previous && options.expectedRevision !== previous.revision) throw new Error(`Revision conflict: current revision is ${previous.revision}. Reopen it and retry with --expected-revision ${previous.revision}.`);
    if (!previous && options.expectedRevision !== undefined) throw new Error("Expected revision supplied for a tour that does not exist.");
    if (previous) validateTourUpdate(previous.document, bundle.document);
    const id = previous?.id ?? randomUUID();
    const revision = (previous?.revision ?? 0) + 1;
    const directory = join(root, id);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await contained(root, directory);
    const staging = join(directory, `.pending-${randomUUID()}`);
    await mkdir(join(staging, "assets"), { recursive: true, mode: 0o700 });
    try {
      for (const [asset, bytes] of bundle.assets) await writeFile(join(staging, "assets", asset), bytes, { mode: 0o600 });
      const result = { id, revision, document: bundle.document };
      await writeFile(join(staging, "document.json"), JSON.stringify(result), { mode: 0o600 });
      // An interrupted write may have completed this revision before switching the pointer.
      // No reader can have selected it, so discard that orphan while holding the writer lock.
      await rm(join(directory, `revision-${revision}`), { recursive: true, force: true });
      await rename(staging, join(directory, `revision-${revision}`));
      const pointer = join(directory, `.current-${randomUUID()}`);
      await writeFile(pointer, JSON.stringify(revision), { mode: 0o600 });
      await rename(pointer, join(directory, "current.json"));
      return result;
    } finally { await rm(staging, { recursive: true, force: true }); }
  } finally { await rm(lock, { recursive: true, force: true }); }
}

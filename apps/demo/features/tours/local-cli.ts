import { readLocalTour, validatePreparedBundle, writeLocalTour } from "./local-store";
import { mergeConcerns } from "./evidence";

function argument(args: string[], flag: string) {
  const index = args.indexOf(flag);
  return index < 0 ? undefined : args[index + 1];
}
export async function localCli(args: string[]) {
  const [command, ...flags] = args;
  if (argument(flags, "--workspace")) process.env.ANAPHOR_TOUR_WORKSPACE = argument(flags, "--workspace");
  if (!command || command === "help" || command === "--help") {
    console.log("Usage: tour local validate|import|update|preview [--file bundle.json] [--id UUID] [--expected-revision N] [--workspace directory] [--origin http://127.0.0.1:3017]\nBundle: {document: <version 1 or 2 tour>, files: {assetId: relativePath}}. Import reuses participating PR associations; existing tours require --expected-revision. Workspace: ANAPHOR_TOUR_WORKSPACE or ~/Library/Application Support/Anaphor/tours. Enable the loopback app with ANAPHOR_LOCAL_PREVIEW=1. Local URLs only work on this machine.");
    return;
  }
  if (!["validate", "import", "update", "preview"].includes(command)) throw new Error("Unknown local operation. Use tour local help.");
  const file = argument(flags, "--file");
  if (command === "validate") {
    if (!file) throw new Error("Supply --file <bundle.json>.");
    const { document } = await validatePreparedBundle(file);
    console.log(JSON.stringify({ valid: true, version: document.version, concerns: mergeConcerns(document) }));
    return;
  }
  const id = argument(flags, "--id");
  const expected = argument(flags, "--expected-revision");
  if (expected && !/^[1-9][0-9]*$/.test(expected)) throw new Error("--expected-revision must be a positive integer.");
  if ((command === "preview" || command === "update") && !id) throw new Error("Supply --id <tour UUID>.");
  if (command !== "preview" && !file) throw new Error("Supply --file <bundle.json>.");
  const origin = new URL(argument(flags, "--origin") ?? "http://127.0.0.1:3017");
  if (origin.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname)) throw new Error("Local preview requires a loopback HTTP origin.");
  const tour = command === "preview" ? await readLocalTour(id!) : await writeLocalTour(file!, { id, expectedRevision: expected ? Number(expected) : undefined });
  console.log(JSON.stringify({ id: tour.id, revision: tour.revision, url: `${origin.origin}/local-tour/${tour.id}` }));
}

// @vitest-environment node
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, test } from "vitest";

test("the publish CLI uploads local bundle media before authenticated same-tour updates", async () => {
  const directory = await mkdtemp(join(tmpdir(), "anaphor-hosted-cli-"));
  const id = randomUUID();
  const requests: { method: string; path: string; auth: string | undefined; key: string | undefined; body: Buffer }[] = [];
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    requests.push({ method: request.method!, path: request.url!, auth: request.headers.authorization, key: typeof request.headers["idempotency-key"] === "string" ? request.headers["idempotency-key"] : undefined, body: Buffer.concat(chunks) });
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(request.method === "PUT" ? { sha256: "accepted" } : { id, revision: 3, url: `${origin}/tour/${id}` }));
  });
  await new Promise<void>((accept) => server.listen(0, "127.0.0.1", accept));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind.");
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    const bytes = Buffer.from("Observed check output.");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const document = { version: 2, title: "Publish the local tour", overview: "Same authored content.",
      prs: [{ url: "https://github.com/example/demo/pull/1", base: "a".repeat(40), head: "b".repeat(40) }],
      sections: [{ id: "slice", title: "Slice", paragraphs: ["Evidence accompanies its claim."] }],
      assets: [{ id: "receipt", mediaType: "text/plain", sha256, bytes: bytes.length, description: "Output", caption: "Check", provenance: "Fictional CLI acceptance" }], evidence: [],
    };
    const file = join(directory,"bundle.json"); const credentials = join(directory,"fictional-credentials.json");
    await writeFile(join(directory,"receipt.txt"), bytes, { mode: 0o600 });
    await writeFile(file,JSON.stringify({ document,files: { receipt: "receipt.txt" } }), { mode: 0o600 });
    await writeFile(credentials,JSON.stringify({ origin,token: "fictional-token",issuedAt: Date.now(),expiresAt: Date.now()+60_000 }),{ mode: 0o600 });
    const helper = join(directory, "fictional-store.mjs");
    await writeFile(helper,await readFile(resolve("apps/demo/features/tours/test/secure-store-fixture.mjs")),{ mode: 0o700 });
    const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>((accept) => {
      const child = spawn(process.execPath,["--import",resolve("apps/demo/node_modules/tsx/dist/loader.mjs"),resolve("apps/demo/features/tours/cli.ts"),"publish","--origin",origin,"--file",file,"--key","same-operation","--id",id,"--expected-revision","2"],{
        env: { ...process.env, ANAPHOR_SECURE_STORE: helper,ANAPHOR_TEST_CREDENTIAL_FILE: credentials },
      });
      let stdout=""; let stderr="";
      child.stdout.on("data",(chunk) => stdout += chunk); child.stderr.on("data",(chunk) => stderr += chunk);
      child.on("close",(code) => accept({ code,stdout,stderr }));
    });
    expect(result.stderr).toBe(""); expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ id,revision: 3 });
    expect(requests.map((request) => [request.method,request.path])).toEqual([["PUT",`/api/tours/assets/${sha256}`],["PATCH",`/api/tours/${id}`]]);
    expect(requests.every((request) => request.auth === "Bearer fictional-token")).toBe(true);
    expect(requests[0]!.body).toEqual(bytes);
    expect(requests[1]!.key).toBe("same-operation");
    expect(JSON.parse(requests[1]!.body.toString())).toMatchObject({ expectedRevision: 2,document: { title: document.title } });
  } finally { await new Promise<void>((accept) => server.close(() => accept())); await rm(directory,{ recursive:true,force:true }); }
});

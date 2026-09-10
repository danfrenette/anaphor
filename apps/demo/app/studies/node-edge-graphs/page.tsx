import type { Metadata } from "next";
import Link from "next/link";
import { NotebookExample } from "../../node-edge-demo";

export const metadata: Metadata = { title: "Node-edge graphs — Anaphor studies" };

export default function NodeEdgeStudyPage() {
  return (
    <main className="mx-auto max-w-[1088px] px-6 pb-16 pt-8">
      <nav aria-label="Studies navigation">
        <Link href="/studies" className="inline-flex min-h-11 items-center text-ui hover:text-primary">← All studies</Link>
      </nav>
      <header className="mb-8 mt-12">
        <h1 className="text-title font-medium tracking-[-.02em]">Node-edge graphs</h1>
        <p className="mt-3 max-w-[60ch] text-body text-muted-foreground">Follow a thought from capture to connected knowledge. Pulses carry each update into the notebook, then onward to search and a summary.</p>
      </header>
      <NotebookExample />
      <p className="mt-6 text-ui text-muted-foreground">Choose a capture source, or play the complete sequence. This is an authored illustration with simulated data.</p>
      <Link href="/#card-media" className="mt-4 inline-flex min-h-11 items-center text-ui underline underline-offset-4">See the three-node card example</Link>
    </main>
  );
}

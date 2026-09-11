import Link from "next/link";
import { Card, CardPreview, CardHeader, CardTitle, CardDescription } from "@anaphor/system";
import { ThreeNodeDiagram } from "../three-node-diagram";

export function NodeEdgeStudyLink() {
  return (
    <section className="mt-16" aria-labelledby="node-edge-study-title">
      <Card variant="showcase" className="[--card-preview-ratio:16/9]">
        <CardPreview><ThreeNodeDiagram /></CardPreview>
        <CardHeader>
          <CardTitle as="h2" id="node-edge-study-title">
            <Link href="/studies/node-edge-graphs" className="inline-flex min-h-11 items-center gap-2 hover:text-primary">Node-edge graphs <span aria-hidden="true">↗</span></Link>
          </CardTitle>
          <CardDescription>Connected nodes, traveling light, and updates that arrive in sequence.</CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
}

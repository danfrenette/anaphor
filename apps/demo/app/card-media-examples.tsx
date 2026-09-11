import Link from "next/link";
import { Card, CardPreview, CardHeader, CardTitle, CardDescription } from "@anaphor/system";
import { ThreeNodeDiagram } from "./three-node-diagram";
import { ShaderExample } from "./shader-example";
import { StudyProvider } from "./studies/study-context";

export function CardMediaExamples() {
  return <section id="card-media" className="mt-12 scroll-mt-8" aria-labelledby="card-media-title">
    <h3 id="card-media-title" className="text-heading font-medium">Artwork as child content</h3>
    <p className="mt-3 prose-reading">The preview owns the frame and clipping. Its children own rendering, interaction, and playback.</p>
    <div className="mt-6 grid items-start gap-6 sm:grid-cols-2">
      <StudyProvider bare><ShaderExample /></StudyProvider>
      <Card variant="showcase" className="[--card-preview-ratio:16/9]">
        <CardPreview><ThreeNodeDiagram /></CardPreview>
        <CardHeader>
          <CardTitle as="h4">Node-edge diagram</CardTitle>
          <CardDescription>Three nodes connected by traveling pulses. <Link href="/studies/node-edge-graphs" className="underline underline-offset-4">Open the full study</Link>.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  </section>;
}

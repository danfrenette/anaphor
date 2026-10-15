"use client";

import { AnnotatedScreenshot, CodeReview, RequirementSummary, Text, VerificationSummary, VideoEvidence, useTheme } from "@anaphor/system";

const illustration = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="#faf9f5"/><rect x="48" y="48" width="864" height="72" fill="#e6e5e0"/><text x="72" y="94" font-family="sans-serif" font-size="28" fill="#222">Local tour · revision 2</text><rect x="48" y="160" width="864" height="332" fill="#f0efeb"/><text x="72" y="210" font-family="sans-serif" font-size="24" fill="#222">Saved draft returned after reopening.</text><text x="72" y="450" font-family="sans-serif" font-size="20" fill="#555">Synthetic reference illustration</text></svg>')}`;

export default function ReviewElementsPage() {
  const { resolvedTheme } = useTheme();
  return <main id="content" tabIndex={-1} className="mx-auto min-w-0 max-w-editorial space-y-12 px-page-inset py-12">
    <header className="space-y-4"><Text as="p" variant="label">Components / Review elements</Text><Text as="h1" variant="title">Explain a change with its proof</Text>
      <Text as="p" variant="body">These examples use synthetic content to demonstrate component behavior. They do not establish an executed product result.</Text></header>
    <section className="space-y-4"><Text as="h2" variant="heading">Requirements</Text><RequirementSummary problem="A reviewer has to move between source and logs." outcome="Read the explanation beside pinned code and evidence." acceptance={["Retain source revisions.", "Keep missing evidence visible."]} /></section>
    <section aria-label="Code review example" className="space-y-4">
      <Text as="h2" variant="heading">Pinned code and authored emphasis</Text>
      <CodeReview before={{path:"save.ts",revision:"a".repeat(40),content:"export function save() {\n  // The old path loses the draft.\n  return undefined;\n}\n"}} after={{path:"save.ts",revision:"b".repeat(40),content:"export function save() {\n  storage.write(draft);\n  // Return after storage accepts the draft.\n  return draft;\n}\n"}}
        theme={resolvedTheme === "dark" ? "dark" : "light"} regions={[{id:"write",label:"Write before returning",side:"after",startLine:2,endLine:2}]}
        notes={[{id:"reason",side:"after",startLine:2,endLine:2,children:"Store the draft before reporting success. This example is illustrative."}]} />
    </section>
    <AnnotatedScreenshot src={illustration} alt="Synthetic local reader showing tour revision 2 and a restored draft" width={960} height={540}
      title="Screenshot with numbered callouts" description="An illustrative reader state; no product action was executed to create this image."
      callouts={[{id:"revision",label:"The selected tour revision stays visible.",x:0.38,y:0.16},{id:"result",label:"The visible outcome belongs beside the action that produced it.",x:0.64,y:0.38}]}
      enlargeLabel="Enlarge example screenshot" closeLabel="Close enlarged screenshot" unavailableLabel="Example screenshot unavailable" />
    <VideoEvidence src="/review-example.webm" title="Video with labelled moments" description="A generated silent gray clip demonstrates native playback and seeking only. Before: the clip is paused. Action: select a moment. After: the playhead moves without starting playback."
      moments={[{id:"before",seconds:0,label:"Before: paused clip"},{id:"action",seconds:0.4,label:"Action: move the playhead"},{id:"after",seconds:0.8,label:"After: playhead advanced"}]} unavailableLabel="Example recording unavailable" />
    <VerificationSummary criterion="Restore a saved draft" result="pass" applicability="stale" superseded={false} required={true} observed="The fictional earlier run restored the draft. Its source differs from the current head." detailsLabel="Execution details and history">
      <p>Example action: save, close, reopen. Source applicability and recorded result remain separate facts.</p>
    </VerificationSummary>
  </main>;
}

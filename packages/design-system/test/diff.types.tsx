import { Diff, type DiffAnnotations, type DiffNote, type DiffSource } from "@anaphor/system";

const note: DiffNote = { id: "guard", title: "Stop at missing sections", body: <p>The caller receives no next section.</p>, presentation: "inline", range: { side: "after", start: 20, end: 22 } };
const annotations: DiffAnnotations = { notes: [note], activeNoteId: null, onActiveNoteChange: id => { id.toUpperCase(); }, revealKey: 1 };
const source: DiffSource = { kind: "unchanged", file: { name: "guard.ts", contents: "const value = 1;\n" }, excerpts: [{ start: 1, end: 1 }] };
<Diff source={source} annotations={annotations} layout="unified" wrap controls context="collapsed" maxHeight={280} />;
// @ts-expect-error Each note explicitly chooses its disclosure presentation.
const missingPresentation: DiffNote = { id: "guard", title: "Guard", body: "Why", range: note.range };
// @ts-expect-error Application-owned annotation selection needs an explicit active ID.
const missingActive: DiffAnnotations = { notes: [note], onActiveNoteChange: () => {} };
// @ts-expect-error Unchanged input explicitly chooses its initial excerpts.
const missingExcerpts: DiffSource = { kind: "unchanged", file: { name: "guard.ts", contents: "one" } };
void missingPresentation;
void missingActive;
void missingExcerpts;

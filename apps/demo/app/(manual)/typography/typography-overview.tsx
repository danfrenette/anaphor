import { Text, Prose, Card, CardHeader, CardTitle, CardContent } from "@anaphor/system";

export function TypographyOverview() {
  return (
    <section id="typography" className="mt-10">
      <Text as="h2" variant="heading" className="mt-3">Type with a purpose</Text>
      <div className="mt-6 grid gap-8 sm:grid-cols-[1fr_2fr]">
        <p className="text-label text-muted-foreground uppercase">
          Instructional measure
        </p>
        <Text as="p" variant="body">
          Bell Gothic Black gives headings their voice. Inter carries the reading
          and interface text. Magda Clean Mono identifies literal values and code.
          Purpose sets the font, size, and rhythm.
        </Text>
      </div>
      <div className="mt-8 border-y border-border py-8">
        <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">Bell Gothic Black / 900</p>
        <Text as="p" variant="display" className="mt-4 max-w-[18ch]">A place for deliberate work.</Text>
        <Text as="p" variant="caption" className="mt-4">Headings balance their lines. Body copy keeps a steady reading measure.</Text>
      </div>
      <div className="mt-8">
        <Card variant="default">
          <CardHeader>
            <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">Reading</p>
            <CardTitle as="h3" variant="heading" className="mt-3">Room to think</CardTitle>
          </CardHeader>
          <CardContent>
            <Prose as="div" aria-label="Article example">
              <p>Good interfaces leave room for the work. A clear heading establishes the subject; a steady rhythm carries the details. <strong>Emphasis has a purpose.</strong> The rest can feel <em>quiet and considered.</em></p>
              <h3>A steady reading rhythm</h3>
              <p>Article text shares one reading color, including <a href="#typography">links</a>, lists, and <code>inline code</code>.</p>
              <ul><li>Give each idea room.</li><li>Keep nested <strong>emphasis</strong> at the same text opacity.</li></ul>
              <blockquote><p>Clear typography lets the writing lead.</p></blockquote>
            </Prose>
            <div className="mt-6 flex items-baseline justify-between gap-3 border-t border-border pt-4 text-ui">
              <Text as="span" variant="ui">Reading progress</Text>
              <span className="font-mono tabular-nums">08 / 24</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

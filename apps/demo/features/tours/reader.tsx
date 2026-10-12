import { ContentSections, Prose, Section, Text } from "@anaphor/system";
import type { TourDocument } from "./document";

export function TourReader({ document, revision }: { document: TourDocument; revision: number }) {
  return <ContentSections className="space-y-12">
    <header className="space-y-6">
      <Text as="h1" variant="display" className="break-words">{document.title}</Text>
      <Text as="p" variant="caption">Revision {revision}</Text>
      <Text as="p" variant="body">{document.overview}</Text>
      <details>
        <summary className="cursor-pointer text-sm">Participating pull requests</summary>
        <ul className="mt-4 space-y-4">
          {document.prs.map((pr) => <li key={pr.url} className="break-all">
            <a href={pr.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{pr.url}</a>
            <Text as="p" variant="caption">Base <code>{pr.base}</code><br />Head <code>{pr.head}</code></Text>
          </li>)}
        </ul>
      </details>
    </header>
    <nav aria-label="Tour sections" className="border-y border-input-border py-6">
      <ul className="flex flex-wrap gap-x-6 gap-y-3">
        {document.sections.map((section) => <li key={section.id} className="min-w-0 max-w-full"><a href={`#${section.id}`} className="underline underline-offset-4 [overflow-wrap:anywhere]">{section.title}</a></li>)}
      </ul>
    </nav>
    {document.sections.map((section) => <Section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="space-y-6 scroll-mt-6">
      <Text as="h2" variant="heading" id={`${section.id}-title`} className="break-words">{section.title}</Text>
      <Prose as="div">{section.paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-wrap break-words">{paragraph}</p>)}</Prose>
    </Section>)}
  </ContentSections>;
}

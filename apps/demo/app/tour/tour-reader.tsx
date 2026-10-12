import { Prose, Section, Text } from "@anaphor/system";
import type { TourDocument } from "../../lib/tours/document";
import { TourScroller, type TourNavEntry } from "./tour-scroller";
import { TourShell } from "./tour-shell";

export function TourReader({ tour }: { tour: TourDocument }) {
  const entries: TourNavEntry[] = [
    { id: "overview", label: "Overview" },
    { id: "provenance", label: "Provenance" },
    ...tour.sections.map((section) => ({ id: section.id, label: section.heading })),
  ];
  return (
    <TourShell label="Private tour">
      <TourScroller entries={entries}>
        <TourArticle tour={tour} />
      </TourScroller>
    </TourShell>
  );
}

function TourArticle({ tour }: { tour: TourDocument }) {
  return (
    <main id="content" tabIndex={-1} className="min-w-0 outline-none">
      <Text as="h1" variant="title">{tour.title}</Text>
      <Section id="overview" aria-labelledby="overview-heading" className="mt-8">
        <Text as="h2" id="overview-heading" variant="heading">Overview</Text>
        <Prose as="div" className="mt-4"><p>{tour.overview}</p></Prose>
      </Section>
      <Section id="provenance" aria-labelledby="provenance-heading" className="mt-10">
        <Text as="h2" id="provenance-heading" variant="heading">Provenance</Text>
        <ul className="mt-4 flex flex-col gap-4">
          {tour.provenance.map((item) => (
            <li key={`${item.repository}#${item.pullRequest}@${item.revision}`}>
              <Text as="p" variant="body">{item.repository} pull request {item.pullRequest}</Text>
              <Text as="p" variant="code" className="mt-1 break-all">{item.revision}</Text>
            </li>
          ))}
        </ul>
      </Section>
      {tour.sections.map((section) => (
        <Section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="mt-10">
          <Text as="h2" id={`${section.id}-heading`} variant="heading">{section.heading}</Text>
          <Prose as="div" className="mt-4"><p className="whitespace-pre-wrap">{section.body}</p></Prose>
        </Section>
      ))}
    </main>
  );
}

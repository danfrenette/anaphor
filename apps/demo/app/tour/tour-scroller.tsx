"use client";

import { ContentSections, useContentSections, WorkspaceCardBody } from "@anaphor/system";
import { useMemo, useRef, type ReactNode } from "react";

export type TourNavEntry = { id: string; label: string };

export function TourScroller({ entries, children }: { entries: readonly TourNavEntry[]; children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useMemo(() => ({ get current() { return scrollRef.current; } }), []);
  return (
    <WorkspaceCardBody ref={scrollRef}>
      <ContentSections defaultScope scrollContainerRef={scrollContainerRef} className="min-h-full">
        <div className="mx-auto grid w-full max-w-editorial gap-8 px-page-inset py-8 md:grid-cols-[12rem_minmax(0,1fr)]">
          <TourNav entries={entries} />
          {children}
        </div>
      </ContentSections>
    </WorkspaceCardBody>
  );
}

function TourNav({ entries }: { entries: readonly TourNavEntry[] }) {
  const { activeId, goTo } = useContentSections();
  return (
    <nav aria-label="Tour sections">
      <ul className="flex flex-wrap gap-2 md:flex-col">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={activeId === entry.id ? "location" : undefined}
              className="inline-flex min-h-11 items-center rounded-md px-2 text-ui no-underline focus-visible:outline-2 focus-visible:outline-ring"
              onClick={(event) => {
                event.preventDefault();
                goTo(entry.id);
                window.history.replaceState(null, "", `#${entry.id}`);
              }}
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

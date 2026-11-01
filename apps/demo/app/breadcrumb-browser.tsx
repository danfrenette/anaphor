"use client";

import { useEffect, useRef, useState } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbButton, BreadcrumbSeparator, Button, ButtonLabel, Text } from "@anaphor/system";

const sections = [
  { number: "1", title: "Research methods" },
  { number: "1.2", title: "Sampling" },
  { number: "1.2.1", title: "Experimental design" },
];

export function BreadcrumbBrowser({ ancestorsOnly }: { ancestorsOnly: boolean }) {
  const [depth, setDepth] = useState(2);
  const heading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const current = sections[depth]!;
  useEffect(() => {
    if (moveFocus.current) {
      heading.current?.focus({ preventScroll: true });
      moveFocus.current = false;
    }
  }, [depth]);

  function browse(index: number) {
    moveFocus.current = ancestorsOnly;
    setDepth(index);
  }

  return <div className="space-y-4">
    {(!ancestorsOnly || depth > 0) && <Breadcrumb aria-label={ancestorsOnly ? "Section ancestry" : "Chapter browsing path"}>
      <BreadcrumbList>
        {sections.slice(0, depth + (ancestorsOnly ? 0 : 1)).map((section, index) => <BreadcrumbItem key={section.number}>
          {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
          <BreadcrumbButton aria-label={`${section.number} ${section.title}`} aria-current={index === depth ? "location" : undefined} onClick={() => browse(index)}>
            {ancestorsOnly ? `${section.number} ${section.title}` : section.number}
          </BreadcrumbButton>
        </BreadcrumbItem>)}
      </BreadcrumbList>
    </Breadcrumb>}
    <Text ref={heading} as="h4" variant="ui" tabIndex={-1} className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{current.number} {current.title}</Text>
    {depth < sections.length - 1 && <Button nativeButton type="button" iconOnly={false} loading={false} shape="square" size="xs" tone="neutral" variant="outline" onClick={() => browse(depth + 1)}><ButtonLabel>Explore next subsection</ButtonLabel></Button>}
  </div>;
}

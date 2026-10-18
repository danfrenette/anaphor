import { Collapsible, CollapsibleTrigger, CollapsibleContent, CardCopyButton } from "@anaphor/system";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

export const catalogIconButtonClassName = "size-9 min-h-9 shrink-0 rounded-md hover:not-data-disabled:bg-muted pointer-coarse:size-11 pointer-coarse:min-h-11";

export function CatalogExample({ title, description, code, children, framed = true }: { title: string; description?: string; code: string; children: ReactNode; framed?: boolean }) {
  return <section aria-label={title}>
    <h3 className="font-sans text-ui font-medium normal-case text-muted-foreground">{title}</h3>
    {description && <p className="mt-2 text-ui text-muted-foreground">{description}</p>}
    <div className={framed ? "mt-4 min-w-0 rounded-md border border-border bg-background" : "mt-4 min-w-0"}>
      <div className={framed ? "p-4 sm:p-6" : ""}>{children}</div>
      <Collapsible className={framed ? "border-t border-border" : undefined}>
        <div className="flex items-center gap-2 px-2 py-1">
          <CollapsibleTrigger aria-label={`Show ${title.toLowerCase()} code`} className="h-9 min-w-0 flex-1 py-0 text-muted-foreground pointer-coarse:h-11"><CaretRight aria-hidden="true" />Show code</CollapsibleTrigger>
          <CardCopyButton value={code} aria-label={`Copy ${title.toLowerCase()} code`} className={catalogIconButtonClassName} />
        </div>
        <CollapsibleContent>
          <pre tabIndex={0} aria-label={`${title} code`} className="max-h-80 overflow-auto border-t border-border p-4 font-mono text-small focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"><code>{code}</code></pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  </section>;
}

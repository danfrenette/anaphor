import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anaphor/system";
import { DropdownMenuExample } from "./dropdown-menu-example";

export function DropdownMenuDemo() {
  return (
    <section id="dropdown-menu" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <div className="flex items-center justify-between gap-6 text-label tracking-[0.08em] text-muted-foreground uppercase">
          <p>02.04 / Control</p>
          <p>Status / Draft</p>
        </div>
        <h2 className="mt-8 text-title font-medium tracking-heading">Dropdown menu</h2>
        <p className="mt-3 prose-reading text-pretty">
          Reveals a short list of actions without taking the user away from their work.
        </p>
      </header>

      <Card variant="default" className="mt-8">
        <CardHeader>
          <CardTitle as="h3" variant="heading">File actions</CardTitle>
          <CardDescription>
            The panel grows from its trigger. Arrow keys move through actions; Escape closes and returns focus.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <DropdownMenuExample />
        </CardContent>
      </Card>
    </section>
  );
}

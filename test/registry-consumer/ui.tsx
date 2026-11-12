import { Toaster, toast } from "./components/ui/toast";
import { MediaViewer } from "./components/ui/media-viewer";
import { Diff } from "./components/ui/diff";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { TagButton } from "./components/ui/tag-button";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbCurrent, BreadcrumbSeparator } from "./components/ui/breadcrumb";
import { Badge } from "./components/ui/badge";
import { Button, ButtonLabel } from "./components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { CardCopyButton } from "./components/ui/card-copy-button";
import { CommandPalette } from "./components/ui/command-palette";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible";
import { Checkbox } from "./components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldItem, FieldLabel } from "./components/ui/field";
import { Radio, RadioGroup } from "./components/ui/radio-group";
import { FieldFeedback } from "./components/ui/field-feedback";
import { Input } from "./components/ui/input";
import { MarkdownEditor } from "./components/ui/markdown-editor";
import { Kbd, KbdGroup } from "./components/ui/kbd";
import { MorphSurface } from "./components/ui/morph-surface";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "./components/ui/menu";
import { Popover, PopoverBody, PopoverClose, PopoverPopup, PopoverTitle, PopoverTrigger } from "./components/ui/popover";
import { ContentSections, Section } from "./components/ui/sections";
import { Separator } from "./components/ui/separator";
import { Skeleton, SkeletonRegion, SkeletonText, SkeletonBox } from "./components/ui/skeleton";
import { Slider } from "./components/ui/slider";
import { Text } from "./components/ui/text";
import { Prose } from "./components/ui/prose";
import "./styles.css";

function Consumer() {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(50);
  const [frequency, setFrequency] = useState<string | null>(null);
  const [editorMarkdown, setEditorMarkdown] = useState("Installed **Markdown**");
  return <main className="mx-auto max-w-workspace px-page-inset py-6 font-sans">
    <div data-testid="editorial-layout" className="mx-auto max-w-editorial"><p className="max-w-reading">Shared layout in an independent consumer.</p></div>
    <Toaster toastManager={toast} position="bottom-right" timeout={5000} limit={3} />
    <button onClick={() => toast.add({ title: "Installed toast", type: "success" })}>Show installed toast</button>
    <Diff source={{ kind: "files", before: { name: "example.ts", contents: "const count = 1;\n" }, after: { name: "example.ts", contents: "const count = 2;\n" } }} layout="unified" wrap={true} controls={false} context="collapsed" maxHeight={null} />
    <button onClick={() => setMediaOpen(true)}>Inspect registry media</button>
    <MediaViewer open={mediaOpen} onOpenChange={setMediaOpen} activeItemId="example" onActiveItemChange={() => {}} initialPanel="annotations"
      items={[{id:"example",sourceKey:"v1",kind:"image",src:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='gray'/%3E%3C/svg%3E",width:800,height:600,alt:"Example",title:"Registry media",annotations:<p>Installed supporting details.</p>}]} />
    <ContentSections defaultScope>
    <Section id="installed-intro" aria-label="Introduction">
    <Text as="h1" variant="title">Registry consumer</Text>
    <Breadcrumb aria-label="Installed path"><BreadcrumbList>
      <BreadcrumbItem><BreadcrumbLink href="#installed-intro">Introduction</BreadcrumbLink></BreadcrumbItem>
      <BreadcrumbItem><BreadcrumbSeparator>/</BreadcrumbSeparator><BreadcrumbCurrent aria-current="location">Controls</BreadcrumbCurrent></BreadcrumbItem>
    </BreadcrumbList></Breadcrumb>
    <Prose as="div"><p>Installed prose with <strong>emphasis</strong>.</p></Prose>
    </Section>
    <Section id="installed-controls" aria-label="Controls">
    <Card variant="default">
      <CardHeader><CardTitle as="h3" variant="heading">Installed UI</CardTitle></CardHeader>
      <CardContent>
        <TagButton size="xs" tone="neutral" variant="soft" loading={false} onClick={() => setCount(count + 1)}><ButtonLabel>Tag action</ButtonLabel></TagButton>
        <Badge size="md" variant="soft" shape="square">Ready</Badge>
        <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="accent" variant="solid" onClick={() => setCount(count + 1)}><ButtonLabel>Count {count}</ButtonLabel></Button>
        <Field orientation="vertical"><FieldLabel>Email</FieldLabel><Input size="md" type="email" /><FieldFeedback hint="Your email address" error="Enter an email" invalid={false} /></Field>
        <MarkdownEditor defaultValue={editorMarkdown} onChange={setEditorMarkdown} aria-label="Registry note" />
        <div role="group" aria-label="Registry Markdown">{editorMarkdown}</div>
        <FieldGroup><Field orientation="horizontal"><Checkbox /><FieldContent><FieldLabel>Accept updates</FieldLabel><FieldDescription>Occasional product news.</FieldDescription></FieldContent></Field></FieldGroup>
        <form aria-label="Installed notification preferences" onSubmit={event => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("frequency");
          setFrequency(typeof value === "string" ? value : null);
        }}>
          <Field orientation="vertical" name="frequency"><FieldLabel>Notification frequency</FieldLabel><RadioGroup defaultValue="daily">
            <FieldItem orientation="horizontal"><Radio value="daily" /><FieldContent><FieldLabel>Daily digest</FieldLabel><FieldDescription>A daily summary.</FieldDescription></FieldContent></FieldItem>
            <FieldItem orientation="horizontal"><Radio value="weekly" /><FieldLabel>Weekly digest</FieldLabel></FieldItem>
          </RadioGroup></Field>
          <button type="submit">Save frequency</button><output aria-label="Saved frequency">{frequency}</output>
        </form>
        <Skeleton variant="static" className="size-10 rounded-full" data-testid="skeleton-avatar" />
        <SkeletonRegion isLoading variant="pulse" label="Loading registry preview">
          <SkeletonBox><p>Media area</p></SkeletonBox>
          <SkeletonText>Installed skeleton</SkeletonText>
        </SkeletonRegion>
        <Collapsible><CollapsibleTrigger>Registry disclosure</CollapsibleTrigger><CollapsibleContent><button>Installed section</button></CollapsibleContent></Collapsible>
        <Separator orientation="horizontal" />
        <Slider label="Amount" value={amount} onChange={setAmount} min={0} max={100} step={10} snap="magnetic" releaseThreshold={0.6} />
        <CardCopyButton value="Registry consumer" aria-label="Copy to clipboard" />
        <Menu>
          <MenuTrigger render={<Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="neutral" variant="outline" />}><ButtonLabel>Registry menu</ButtonLabel></MenuTrigger>
          <MenuPopup align="center" side="bottom" sideOffset={6}><MenuItem variant="default">Installed action</MenuItem></MenuPopup>
        </Menu>
        <Popover>
          <PopoverTrigger>Registry popover</PopoverTrigger>
          <PopoverPopup side="bottom" align="start" sideOffset={8}>
            <PopoverBody>
              <PopoverTitle>Installed preferences</PopoverTitle>
              <PopoverClose>Done</PopoverClose>
            </PopoverBody>
          </PopoverPopup>
        </Popover>
        <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="neutral" variant="outline" onClick={() => setCommandOpen(true)}><ButtonLabel>Registry search</ButtonLabel></Button>
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} title="Registry commands" items={[{ id: "count", label: "Increment count", group: "Actions" }]} onSelect={() => setCount(count + 1)}
          renderTrailing={() => <KbdGroup aria-label="G then I"><Kbd>G</Kbd><Kbd>I</Kbd></KbdGroup>} />
        <p className="font-mono">Installed source</p>
      </CardContent>
    </Card>
    </Section>
    </ContentSections>
    <div className="fixed bottom-4 right-4">
      <MorphSurface open={open} onOpenChange={setOpen} title="Registry controls" icon={<span>+</span>}>
        <p>Installed surface</p>
      </MorphSurface>
    </div>
  </main>;
}

createRoot(document.getElementById("root")!).render(<Consumer />);

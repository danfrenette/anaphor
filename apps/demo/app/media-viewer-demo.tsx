"use client";

import { useRef, useState } from "react";
import {
  Button, ButtonLabel, Collapsible, CollapsibleContent, CollapsibleTrigger,
  MediaViewer, Popover, PopoverTrigger, PopoverPopup, PopoverBody, PopoverTitle, PopoverDescription, Section, Text, type MediaViewerItem,
} from "@anaphor/system";
import { CatalogExample } from "./catalog-example";
import { PlaygroundControls } from "./playground-host";
import { Select } from "./playground-fields";

const evidence = <div><dl className="space-y-3 text-ui">
  <div><dt className="text-muted-foreground">Source</dt><dd>Locally authored fixture</dd></div>
  <div><dt className="text-muted-foreground">Purpose</dt><dd>Demonstrate inspection, not evidence of a product change.</dd></div>
  <div><dt className="text-muted-foreground">Availability</dt><dd>Bundled with this reference manual.</dd></div>
</dl><Popover><PopoverTrigger render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} className="mt-4" />}><ButtonLabel>About this fixture</ButtonLabel></PopoverTrigger><PopoverPopup side="top" align="end" sideOffset={8}><PopoverBody><PopoverTitle>Fixture details</PopoverTitle><PopoverDescription>The image is locally authored. It is an illustration, not an execution receipt.</PopoverDescription></PopoverBody></PopoverPopup></Popover></div>;
const image: MediaViewerItem = {
  id: "landscape", sourceKey: "landscape-v1", kind: "image", title: "Landscape inspection",
  src: "/media/landscape.svg", alt: "Illustrative reading room with a continue reading action",
  width: 1440, height: 900,
  caption: "Illustrative desktop interface · 1440 × 900 pixels",
  annotations: <div className="space-y-4"><Text as="p" variant="body">The complete image stays visible in Fit. Actual size makes each captured pixel one CSS pixel. Then use Locate action to bring Continue reading into view.</Text><Collapsible><CollapsibleTrigger>1. Continue reading</CollapsibleTrigger><CollapsibleContent><Text as="p" variant="body">The primary action follows the reading preview. Annotation details can use the same shared disclosures as inline content.</Text></CollapsibleContent></Collapsible></div>, evidence,
};
const video: MediaViewerItem = {
  id: "recording", sourceKey: "recording-v1", kind: "video", title: "Recording inspection",
  src: "/media/inspection.mp4",
  tracks: [{ src: "/media/inspection.vtt", srcLang: "en", label: "English account", kind: "captions", default: true }],
  caption: "Six-second silent recording · locally generated example",
  annotations: <ol className="list-decimal space-y-4 ps-5 text-body"><li>Before, 0:00: the canvas is empty.</li><li>Action, 0:02: an orange rectangle appears on the left.</li><li>After, 0:04: the rectangle appears on the right.</li></ol>, evidence,
};
const portrait: MediaViewerItem = {
  ...image, id: "portrait", sourceKey: "portrait-v1", title: "Portrait inspection",
  src: "/media/portrait.svg", width: 390, height: 844, caption: "Illustrative mobile interface · 390 × 844 pixels",
};
const unavailable: MediaViewerItem = {
  ...image, id: "unavailable", sourceKey: "unavailable-v1", title: "Unavailable image",
  src: "/media/intentionally-unavailable.png",
  annotations: <Text as="p" variant="body">This explanation remains available when the capture cannot load.</Text>,
};
const unavailableVideo: MediaViewerItem = { ...video, id: "unavailable-video", sourceKey: "unavailable-video-v1", src: "/media/intentionally-unavailable.mp4", title: "Unavailable recording" };
const longTitle: MediaViewerItem = { ...image, id: "long-title", title: "Continue reading after returning to a saved article: desktop capture showing the restored reading position and the next available section" };
const examples = [
  { title: "Individual image", label: "Inspect landscape image", items: [image], description: "Fit and actual-size inspection with a supporting annotation panel." },
  { title: "Individual recording", label: "Inspect recording", items: [video], description: "Video.js v10 playback with captions and a readable account." },
  { title: "Mixed collection", label: "Inspect mixed collection", items: [image, video, portrait], description: "Finite previous/next navigation. Leaving a recording pauses playback; revisiting retains its position." },
  { title: "Long content", label: "Inspect long title", items: [longTitle], description: "Long supplied titles remain readable while Close and inspection controls stay reachable." },
  { title: "Unavailable recording", label: "Inspect unavailable recording", items: [unavailableVideo], description: "The readable action account remains available when video playback fails." },
  { title: "Unavailable asset", label: "Inspect unavailable image", items: [unavailable], description: "A failed asset keeps its caption and explanation available, with an explicit retry." },
];

export function MediaViewerDemo() {
  const [open, setOpen] = useState(false);
  const [revealKey, setRevealKey] = useState(0);
  const [items, setItems] = useState<readonly MediaViewerItem[]>([image]);
  const [activeItemId, setActiveItemId] = useState(image.id);
  const [initialPanel, setInitialPanel] = useState<"annotations" | "evidence" | "closed">("annotations");
  const opener = useRef<HTMLElement | null>(null);
  return <Section id="media-viewer" className="border-t border-border py-12">
    <Text as="h2" variant="title">Media viewer</Text>
    <Text as="p" variant="description" className="mt-3">Inspect images and recordings in a shared dialog. Keep the same content within reach through a compact console and one supporting panel.</Text>
    <div className="mt-10 space-y-10">{examples.map(example => <CatalogExample key={example.title} title={example.title} description={example.description}
      code={'<MediaViewer open={open} onOpenChange={setOpen}\n  items={items} activeItemId={activeId}\n  onActiveItemChange={setActiveId} initialPanel="annotations" />'}>
      <Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false}
        onClick={event => { const first = example.items[0]; if (!first) return; opener.current = event.currentTarget; setRevealKey(0); setItems(example.items); setActiveItemId(first.id); setOpen(true); }}><ButtonLabel>{example.label}</ButtonLabel></Button>
    </CatalogExample>)}</div>
    <MediaViewer open={open} onOpenChange={setOpen} items={items.map(item => item.kind === "image" && item.id !== "unavailable" ? { ...item,
        reveal: revealKey > 0 ? { x: 114 / item.width, y: 522 / item.height, key: revealKey } : undefined,
        annotations: inspection => <>{typeof item.annotations !== "function" && item.annotations}<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} className="mt-4" disabled={inspection.imageSize !== "actual"} title="Choose Actual size to locate Continue reading" onClick={() => setRevealKey(key => key + 1)}><ButtonLabel>Locate action</ButtonLabel></Button></>,
      } : item)} activeItemId={activeItemId} onActiveItemChange={setActiveItemId}
      initialPanel={initialPanel === "closed" ? null : initialPanel} returnFocus={opener}
      />
    <PlaygroundControls sectionId="media-viewer" title="Media viewer" onReset={() => setInitialPanel("annotations")}>
      <Select label="Opening panel" value={initialPanel} options={["annotations", "evidence", "closed"]} onChange={setInitialPanel} />
    </PlaygroundControls>
  </Section>;
}

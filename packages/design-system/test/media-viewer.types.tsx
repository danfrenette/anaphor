import { MediaViewer, type MediaViewerItem } from "@anaphor/system";
const image = { id: "capture", sourceKey: "hash", kind: "image", src: "/capture.png", alt: "Result", width: 400, height: 300, title: "Result" } satisfies MediaViewerItem;
<MediaViewer open={false} onOpenChange={() => {}} items={[image]} activeItemId="capture" onActiveItemChange={() => {}} initialPanel={null} />;
// @ts-expect-error Supporting panel initial state is an explicit configuration.
<MediaViewer open={false} onOpenChange={() => {}} items={[image]} activeItemId="capture" onActiveItemChange={() => {}} />;
// @ts-expect-error Images must declare the captured dimensions.
const incomplete: MediaViewerItem = { id: "capture", sourceKey: "hash", kind: "image", src: "/capture.png", alt: "Result", title: "Result" };
void incomplete;

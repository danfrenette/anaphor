import { Toaster, createToastManager, toast } from "@anaphor/system";
import { createRef } from "react";
import { expectTypeOf } from "vitest";

const ref = createRef<HTMLDivElement>();
<Toaster toastManager={toast} position="bottom-left" timeout={5000} limit={3} viewportProps={{ ref }} />;
// @ts-expect-error Position, timeout and limit are explicit consumer choices.
<Toaster toastManager={toast} />;
<Toaster toastManager={toast} position="top-center" timeout={5000} limit={3} />;
<Toaster toastManager={toast} position="bottom-center" timeout={5000} limit={3} />;
// @ts-expect-error Only six edge positions are supported.
<Toaster toastManager={toast} position="middle" timeout={5000} limit={3} />;
const manager = createToastManager<{ noteId: string }>();
expectTypeOf(manager.add({ title: "Saved", data: { noteId: "research" } })).toEqualTypeOf<string>();
manager.promise(Promise.resolve(3), { loading: "Saving", success: count => {
  expectTypeOf(count).toEqualTypeOf<number>();
  return "Saved";
}, error: "Failed" });

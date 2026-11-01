import { createRef } from "react";
import { Breadcrumb, BreadcrumbLink, BreadcrumbButton, BreadcrumbCurrent } from "@anaphor/system";

<Breadcrumb aria-label="Path" ref={createRef<HTMLElement>()} />;
<BreadcrumbLink href="/library" ref={createRef<HTMLAnchorElement>()} onClick={event => event.currentTarget.href} />;
<BreadcrumbButton ref={createRef<HTMLButtonElement>()} onClick={event => event.currentTarget.focus()} aria-current="location" />;
<BreadcrumbCurrent aria-current="page" ref={createRef<HTMLSpanElement>()} />;
// @ts-expect-error Navigation needs an accessible name.
<Breadcrumb />;
// @ts-expect-error A link must declare its URL.
<BreadcrumbLink />;
// @ts-expect-error In-place navigation cannot submit a surrounding form.
<BreadcrumbButton type="submit" />;
// @ts-expect-error Current semantics are an explicit caller choice.
<BreadcrumbCurrent />;

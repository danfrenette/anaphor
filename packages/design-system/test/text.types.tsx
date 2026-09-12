import { createRef } from "react";
import { Text, Prose } from "@anaphor/system";

// Compile-time coverage for the public native-element contract.
const spanRef = createRef<HTMLSpanElement>();
const headingRef = createRef<HTMLHeadingElement>();
const paragraphRef = createRef<HTMLParagraphElement>();
const articleRef = createRef<HTMLElement>();

<Text as="span" ref={spanRef} onClick={event => { const span: HTMLSpanElement = event.currentTarget; void span; }} />;
<Text variant="ui" ref={spanRef} />;
<Text variant="display" ref={headingRef} />;
<Text ref={paragraphRef} />;
<Prose as="article" ref={articleRef} />;

// @ts-expect-error A span ref cannot receive the default paragraph.
<Text ref={spanRef} />;
// @ts-expect-error An article ref cannot receive the default div.
<Prose ref={articleRef} />;
<Text variant="ui" onClick={event => {
  // @ts-expect-error UI defaults to span, which has no paragraph alignment property.
  void event.currentTarget.align;
}} />;

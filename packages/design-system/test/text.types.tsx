import { createRef } from "react";
import { Text, Prose } from "@anaphor/system";

// Compile-time coverage for the public native-element contract.
const spanRef = createRef<HTMLSpanElement>();
const headingRef = createRef<HTMLHeadingElement>();
const paragraphRef = createRef<HTMLParagraphElement>();
const articleRef = createRef<HTMLElement>();

<Text variant="body" as="span" ref={spanRef} onClick={event => { const span: HTMLSpanElement = event.currentTarget; void span; }} />;
<Text as="span" variant="ui" ref={spanRef} />;
<Text as="h1" variant="display" ref={headingRef} />;
<Text as="h2" variant="section" ref={headingRef} />;
<Text as="p" variant="body" ref={paragraphRef} />;
<Prose as="article" ref={articleRef} />;

// @ts-expect-error A span ref cannot receive a paragraph.
<Text as="p" variant="body" ref={spanRef} />;
// @ts-expect-error An article ref cannot receive a div.
<Prose as="div" ref={articleRef} />;
<Text as="span" variant="ui" onClick={event => {
  // @ts-expect-error A span has no paragraph alignment property.
  void event.currentTarget.align;
}} />;

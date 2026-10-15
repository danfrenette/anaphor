import { createRef } from "react";
import { CodeReview, type CodeReviewProps } from "@anaphor/system";

const source = { path: "empty.ts", revision: "abc123", content: "" };
const shared = { regions: [], notes: [], theme: "light" as const };
const ref = createRef<HTMLElement>();
<CodeReview {...shared} before={source} after={null} ref={ref} />;
<CodeReview {...shared} before={null} after={source} />;
// @ts-expect-error A review must have at least one captured side.
<CodeReview {...shared} before={null} after={null} />;
// @ts-expect-error Theme configuration is explicit.
const missingTheme: CodeReviewProps = { before: source, after: source, regions: [], notes: [] };
void missingTheme;

# Paper workflow

## Establish source and destination

The reference is [Anaphor / Foundations](https://app.paper.design/file/01M3J9GPPBQJ540Q1D8G446J5P/p-1-0). Load the connected Paper tool's guide, then inspect the file, current tokens, and relevant Light/Carbon boards. Read exact styles for needed specimens; screenshots verify appearance, not token values. Inspect today's contents rather than relying on an earlier token count or layer IDs.

Treat this file as read-only when designing another project. Use the user's destination file, or create a separate project file if the available tools support it. If they cannot create a file, ask the user to create/open one; do not put the project in the source library as a silent fallback.

Done: source and destination are distinct, and the required tokens and specimens have been located. If Paper is unavailable, report the missing connection and offer a code-backed plan; do not claim a design was created.

## Transfer the required foundations

Inspect destination tokens before importing. Reuse matching definitions; resolve name collisions explicitly so existing project designs retain their meaning. Copy required token definitions and dependencies using supported tools. Preserve semantic names and Light/Carbon pairs. Verify them by reading back destination tokens and styles on one sample node.

Treat copied tokens and specimens as a snapshot unless a supported cross-file link has been verified. Record the source file and date in a small destination reference note so future updates can be compared deliberately.

Verify font availability before styling. The established desktop mapping is Inter; Bell Gothic Std, Black face at native weight 700; and MagdaCleanMonoWebW03-Rg at 400. The web heading alias is Bell Gothic Black at 900: this names the same supplied face, not permission to synthesize a heavier desktop weight. If a font is unavailable, ask for the font or approval for a named temporary fallback and label the substitution.

Done: a destination sample resolves the intended font and token colors. Check font rights before redistributing assets; local installation alone does not establish a redistribution license.

## Build the page

Bind supported properties to the saved tokens. For unsupported expressions such as a variable-based color mix or composite shadow, resolve the current source recipe for the selected theme, record its provenance, and describe it as a static derived value rather than a live token binding.

Set type properties directly on text nodes when Paper drops frame inheritance. For a font-relative reading measure such as `65ch`, measure the loaded web reference at the matching font and size; use that pixel measure for the specimen, bounded by available width. If measurement is unavailable, identify the approximation. Paragraphs before and after wide media share the same centered track.

Build Light and Carbon on separate artboards when both are requested. Duplicate structure, then check every theme-dependent text, surface, border, state mix, and shadow; replacing the canvas color alone is insufficient. Include narrow and wide compositions when responsive layout is in scope, with notes describing collapse behavior.

Done: inspect screenshots for spacing, hierarchy, contrast, alignment, and clipping. Read back representative styles to verify token bindings and font weights. Fix discrepancies and use Paper's completion tool after edits. Describe focus management, keyboard behavior, and motion as implementation requirements, not functionality proved by static boards.

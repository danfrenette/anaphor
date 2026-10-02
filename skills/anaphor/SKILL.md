---
name: anaphor
description: Apply Anaphor when designing pages in Paper, implementing interfaces in another project, or reviewing an interface for Anaphor consistency.
---

# Use Anaphor

Treat Anaphor as a source-owned system, not a visual mood to approximate.

## 1. Locate the sources

Use the user's Anaphor checkout or [repository](https://github.com/danfrenette/anaphor). A local checkout must contain `packages/design-system/src/styles.css` and `registry.json`; the destination application alone is not the upstream reference. If neither source is accessible, ask for repository access or an exported reference before inventing system values.

Read `docs/foundations.md` and `docs/layout-recipes.md` from that checkout. Read the relevant component source and component documentation for the requested screen. Consult `DESIGN.md` for rationale; exact values, props, and behavior come from shipped CSS and component source. Report discrepancies rather than silently changing the system to reconcile stale prose.

Finish this step with the source revision, destination, requested theme(s), and needed components identified. Infer these from the request and existing project; ask only for choices that materially change the result.

## 2. Select the workflow

- **Paper design:** read [paper.md](paper.md).
- **Code implementation:** read [implementation.md](implementation.md).
- **Design and implementation:** follow both, with code governing behavior and Paper governing the approved composition.
- **Review only:** use the applicable reference to inspect and report differences; leave files and designs unchanged.

## 3. Compose with the system

Map each text role, surface, control, and layout bound to an existing source before adding local styling. Reuse public semantic names: public `foreground` is primary text, while private `--anaphor-foreground` is a raised surface. Equal values do not make distinct roles interchangeable.

Choose layout by content: a reading track inside an editorial canvas for articles; a workspace bound for dense applications; a smaller content-led width for forms and dialogs. Ordinary gaps stay Tailwind spacing choices. The manual's sidebar and study-specific chart layouts are examples, not required application chrome.

Use `Text` roles and `Prose` rules rather than reassembling typography. Bell Gothic is uppercase through styling; keep source copy in natural case. Read the selected role's wrapping rule rather than applying pretty wrapping to every body paragraph.

Keep new charts, shader colors, and one-off proportions local to the page. For a missing component, first compose existing primitives. If the gap requires a new shared contract or visual language, ask the user for a concrete example or reference; a new page does not authorize changing Anaphor's foundations.

Preserve the approved bright-label/orange-solid contrast exception and identify it as an exception, not AA compliance. Check other text and focus states normally. Consult `docs/components/slider.md` before using or modifying Slider: its DialKit treatment is a deliberate local exception.

## 4. Verify and hand off

Complete the branch-specific checks before calling the result finished. Report the result location, sources used, local extensions, and anything not verified. Distinguish saved tokens, static specimens, and working components; these are different deliverables.

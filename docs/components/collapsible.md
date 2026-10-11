# Collapsible

Use `Collapsible`, `CollapsibleTrigger`, and `CollapsibleContent` from
`@anaphor/system`. `CollapsiblePanel` is an alias for Content. Install owned source
with `pnpm dlx shadcn@latest add danfrenette/anaphor/collapsible`, or install `ui`.

```tsx
<Collapsible defaultOpen>
  <CollapsibleTrigger>Reading notes</CollapsibleTrigger>
  <CollapsibleContent><p>Consumer-owned content.</p></CollapsibleContent>
</Collapsible>
```

For application-owned state:

```tsx
const [open, setOpen] = useState(false);
<Collapsible open={open} onOpenChange={setOpen}>
  <CollapsibleTrigger>Chapter contents</CollapsibleTrigger>
  <CollapsiblePanel><button onClick={() => setOpen(false)}>Close</button></CollapsiblePanel>
</Collapsible>
```

Base UI props, refs, state-aware classes, and render composition pass through.
`disabled` on the root disables its disclosure; a trigger can also be disabled
individually. The change callback receives Base UI event details and can cancel
an interaction. Compose one trigger and one panel per root; nest another root
for each nested section. A direct child Phosphor `CaretRight` rotates when open.
Other labels and content remain consumer-owned.

The trigger uses button semantics: Tab reaches visible controls, Enter/Space
toggles. Closing content becomes inert and hidden from assistive technology
immediately, including during its height transition. If focus was in that panel,
closing returns it to the corresponding trigger. External controlled closure
does not take focus from a control elsewhere. Reduced motion removes transitions.
The panel clips its transition; give inner content padding for visible focus rings.

The manual's `/#collapsible` section demonstrates standalone state and a close
control inside the panel. The existing Sidebar contains a nested Source outline
after the manual index. It uses lists and buttons, with `aria-current` on the
selected section. Each chapter owns expansion; the outline owns selection above
all panels. This separation preserves selection when content unmounts. Tab visits
visible controls; arrow keys have ordinary browser behavior. This is not an ARIA
tree. Chapter 2 includes an illustrative nested branch beyond the initial wireframe.

## Resource evaluation

[ANAPHOR-227](https://linear.app/anaphor/issue/ANAPHOR-227/keep-long-source-outlines-navigable-with-collapsible-sections)
provided the Autodidact wireframe: chapter 1 and sections 1.1–1.3, Knowledge
crunching selected, chapters 2/3 closed. The example follows those initial states
and the inset selected row with a leading selection rule, using Anaphor tokens.
Search, chapter loading, and the center/right workspaces remain outside scope.

[Pierre Trees](https://trees.software/docs) `1.0.0-beta.6` was prototyped in a real
Chromium browser before choosing the implementation. Canonical chapter/section
paths represented the hierarchy, and initial expansion/selection rendered with
tree semantics. Clicking the expanded chapter row collapsed it **and replaced**
the selected section with the chapter path. The prototype's selection callback
reported `["1 Putting the domain model to work/"]` after starting at section 1.1.
The published `computeFileTreeRowClickPlan` likewise combines single selection
with directory toggling. That conflicts with this ticket's disclosure-only rule.

Trees owns rendering and expansion; its row decorations add slots rather than
replacing the row's selection contract. Adapting that model would require
intercepting or undoing selection, or introducing a second state owner. For this
scope we chose the explicitly permitted disclosure fallback. Trees remains a
candidate for a future true tree with a separately specified selection model;
this evaluation does not claim its keyboard model is defective.

The root/trigger/content vocabulary follows
[shadcn's Base Collapsible](https://ui.shadcn.com/docs/components/base/collapsible).
[Coss Collapsible](https://coss.com/ui/docs/components/collapsible#api-reference)
informs the thin Base UI wrapper and Panel/Content naming. Anaphor supplies
its own tokens, wrapping rows, focus treatment, and expansion timing.
The project resources—[system purpose](https://devouringdetails.com/system/purpose),
[Button](https://devouringdetails.com/system/button),
[Maxime Heckel's design-system article](https://blog.maximeheckel.com/posts/building-a-design-system-from-scratch/),
and [Emil Kowalski](https://emilkowal.ski/)—were considered alongside `DESIGN.md`:
keep primitives reusable, presentation token-based, and motion subordinate to use.

Selection persists for the mounted outline, not across reloads. There is no
virtualization, search, drag/drop, or tree arrow navigation. A very large source
would need a separate scale and keyboard-model decision.

See [verification](../verification/collapsible.md) for executable coverage.

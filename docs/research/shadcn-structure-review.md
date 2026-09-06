# Button and reference manual structure review

Reviewed 2026-09-06. Scope: the design system's Button and Separator modules, the reference manual, and shadcn generation settings. Recommendations are review judgments; upstream patterns are evidence, not requirements. No implementation changes accompany this report.

## Comparators

- **shadcn-ui/ui, current Base UI registry:** closest match to our primitive foundation. Its [Button](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/button.tsx) combines Base UI with a local variant definition, including explicit icon sizes. Its [Button examples](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/examples/button-example.tsx) group demonstrations by behavior into named functions.
- **cosscom/coss:** Cal.com's design system, with a [shared UI package](https://github.com/cosscom/coss/tree/main/packages/ui) and a [documentation application](https://github.com/cosscom/coss/tree/main/apps/ui). Its [Button module](https://github.com/cosscom/coss/blob/main/packages/ui/src/components/button.tsx) uses CVA, explicit icon dimensions, and an integrated loading state. Unlike our Button, it builds composition with `useRender` and `mergeProps`.
- **shadcn-ui/taxonomy, historical only:** its [Button](https://github.com/shadcn-ui/taxonomy/blob/main/components/ui/button.tsx) also colocates variants and rendering. The [repository explicitly says it is archived and does not reflect current best practices](https://github.com/shadcn-ui/taxonomy). Do not import its older Next.js or React patterns.

Links reference the branches inspected on the review date, not immutable commits. Commit identifiers could not be verified through the available retrieval path.

## Recommended: correct concrete contracts first

### 1. Preserve Separator's advertised className callback

**Local evidence:** `packages/design-system/src/components/separator.tsx:10` accepts all `SeparatorPrimitive.Props`, but line 17 passes `className` straight into `cn`. The local class merger discards a function rather than evaluating it. A local reproduction confirmed that the callback is never called. Button already handles both forms at `packages/design-system/src/components/button.tsx:72`.

**Impact:** a consumer can pass a type-valid orientation-based class callback and silently receive none of its classes. This is a real public-interface bug, despite ordinary string overrides working.

**Change:** resolve the callback using the primitive's state before merging defaults, following the existing Button adapter. Keep the implementation local rather than introducing a generic adapter for two short expressions. Add a public-package test using a callback and verify its class alongside the defaults.

**Primary evidence:** [Base UI's Separator contract](https://base-ui.com/react/components/separator) explicitly permits `className` as a string or a state function. Both [shadcn's wrapper](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/separator.tsx) and [coss's registry wrapper](https://github.com/cosscom/coss/blob/main/apps/ui/registry/default/ui/separator.tsx) visibly pass `className` into their merger; these are not proof of correct callback behavior. The underlying primitive contract is the standard to preserve.

### 2. Give icon-only Buttons a real sizing contract

**Local evidence:** `apps/demo/app/button-demo.tsx:109` marks Continue with `data-icon-only`, but no package rule consumes that marker. Its ordinary `md` sizing retains 14px horizontal padding. Production-browser inspection measured **46 × 40px**, so `shape="round"` produces an oval instead of a circle.

**Change:** express icon-only sizing explicitly in the Button module, using an actual prop or documented size variant with matched width and height. Keep shape independent of content sizing. Cover regular and coarse-pointer dimensions, and ensure the loading state fits the chosen dimensions. The current accessible name is already provided; this finding concerns sizing, not a demonstrated accessibility failure.

**Primary evidence:** both [shadcn's Button size variants](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/button.tsx) and [coss's Button size variants](https://github.com/cosscom/coss/blob/main/packages/ui/src/components/button.tsx) explicitly distinguish icon sizes. We can adopt that clarity without copying their complete variant sets.

### 3. Align the shadcn generator with the package's actual layout

**Local evidence:** `packages/design-system/components.json:16` sends generated controls to `#components/ui`; existing controls live directly under `src/components`, with the package import map resolving `#components/*` to that directory. New generated modules would therefore land in a second nested location. Line 13 selects Lucide while the reference manual uses Phosphor.

**Change:** align the UI alias with the current flat directory and set the intended icon family. Validate generation in a disposable fixture before treating the configuration as a supported workflow. If CLI generation is intentionally unused, document that rather than reorganizing existing files around an unused setting.

**Primary evidence:** the [official components.json documentation](https://ui.shadcn.com/docs/components-json#aliasesui) says `aliases.ui` controls where generated UI files are placed; it also explains package-import resolution and says the configuration is optional outside CLI usage. This is consistency maintenance, not a request for a registry publishing system.

## Optional: simplify where changes currently spread

### Consolidate Button's size facts, without mandating CVA

`button.tsx:7`–`26` repeats the same four sizes in root, content, and loader maps; the public size union is written again. A single local size definition could hold root/content/icon decisions together and derive the size type from its keys. Alternatively, shared CSS values could let the content and spinner inherit gap and icon dimensions. Pick whichever makes one size change easiest to inspect.

The leverage is locality: adding a size should not require synchronizing four independently written lists. Keep the optical label adjustment and internal content grouping. Both current comparator Buttons use CVA, but that convention alone does not justify another dependency or an exported variants helper without a consumer. ([shadcn Button](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/button.tsx), [coss Button](https://github.com/cosscom/coss/blob/main/packages/ui/src/components/button.tsx).)

### Separate the interactive playground from static examples as the manual grows

`apps/demo/app/button-demo.tsx` owns controls state, a floating panel, static state examples, composition examples, and theme examples in one client module. `page.tsx` already stays separate and static. The first useful seam would move the playground's state and panel together, leaving readable named static examples beside it. That can reduce the surface affected by controls edits; it does not require a new directory for every function.

The [shadcn example file](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/examples/button-example.tsx) groups variants, icon placement, icon-only controls, and other cases into named functions, while retaining one file. The [coss docs application](https://github.com/cosscom/coss/tree/main/apps/ui) separates documentation content and registry material. Borrow the ownership distinction, not their generator and documentation infrastructure. This is a maintainability suggestion; no measured rendering-performance problem establishes urgency.

## Keep

- **ButtonLabel:** it encodes the chosen coherent-phrase and optical-alignment contract. Neither comparator's plain-text composition invalidates this deliberate product choice. Do not return to automatic child inspection.
- **Integrated loading behavior:** it centralizes disabled behavior, focus retention, and busy semantics. shadcn's [composition guidance](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/rules/composition.md) uses a composed spinner, while [coss](https://github.com/cosscom/coss/blob/main/packages/ui/src/components/button.tsx) supports a loading prop. There is no single upstream rule requiring removal of ours.
- **Independent package plus consumer demo:** this matches the user's intended distribution seam. coss's [package manifest](https://github.com/cosscom/coss/blob/main/packages/ui/package.json) exposes source modules and styles, so a source-based package is not inherently immature. Its Next.js peer requirement serves its broader scope and should not be copied into this framework-independent package.
- **Base UI delegation, custom tokens, public-package tests, and the local class merger:** these already have concrete responsibilities. Avoid a generic variant framework, registry compiler, or barrel-file reorganization without a real consumer need.

## Suggested order

Fix the Separator callback, establish icon-only sizing, and align generator settings. Then consolidate size facts while preserving current visuals. Split the reference manual only where interactive state and static examples have distinct ownership. These are independent reviewable changes; a wholesale shadcn-shaped rewrite would add churn without demonstrated benefit.

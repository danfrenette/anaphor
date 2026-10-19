import { Section, Text, Button, ButtonLabel } from "@anaphor/system";
import { ArrowRight, Trash } from "@phosphor-icons/react/dist/ssr";
import { CatalogExample, catalogIconButtonClassName } from "./catalog-example";
import { ButtonPlayground } from "./button-playground";
import { ButtonLoadingExample } from "./button-loading-example";
import { ButtonHoldExample } from "./button-hold-example";

const variants = ["solid", "outline", "ghost", "soft"] as const;
const tones = ["neutral", "accent", "danger"] as const;
const sizes = ["xs", "sm", "md", "lg"] as const;

export function ButtonDemo() {
  return (
    <Section id="button" className="border-t border-border py-12">
      <Text as="h2" variant="title">Button</Text>
      <Text as="p" variant="description" className="mt-3">
        Triggers an immediate action. Use one primary action per surface.
      </Text>

      <div className="mt-10 space-y-10">
        <CatalogExample title="Variants & tones" code={`<Button nativeButton={true} type="button"
  variant="solid" tone="neutral" size="md" shape="square"
  iconOnly={false} loading={false}>
  <ButtonLabel>Continue</ButtonLabel>
</Button>
// Variants: solid, outline, ghost, soft
// Tones: neutral, accent, danger`}>
          <div className="space-y-5">
            {tones.map(tone => (
              <div key={tone} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <p className="w-16 shrink-0 text-ui text-muted-foreground capitalize">{tone}</p>
                <div className="flex flex-wrap items-center gap-3">
                  {variants.map(variant => (
                    <Button key={variant} nativeButton={true} type="button" variant={variant} tone={tone} size="md" shape="square" iconOnly={false} loading={false}>
                      <ButtonLabel className="capitalize">{variant}</ButtonLabel>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CatalogExample>

        <CatalogExample title="Sizes" code={`<Button nativeButton={true} type="button"
  variant="outline" tone="neutral" size="xs" shape="square"
  iconOnly={false} loading={false}>
  <ButtonLabel>Continue</ButtonLabel>
</Button>
// Sizes: xs, sm, md, lg`}>
          <div className="flex flex-wrap items-end gap-6">
            {sizes.map(size => (
              <div key={size} className="flex flex-col items-center gap-3">
                <Button nativeButton={true} type="button" variant="outline" tone="neutral" size={size} shape="square" iconOnly={false} loading={false}><ButtonLabel>Continue</ButtonLabel></Button>
                <span className="text-small text-muted-foreground uppercase">{size}</span>
              </div>
            ))}
          </div>
        </CatalogExample>

        <CatalogExample title="Icons & Shapes" code={`<Button nativeButton={true} type="button"
  variant="outline" tone="neutral" size="md" shape="square"
  iconOnly={false} loading={false}>
  <ArrowRight aria-hidden="true" />
  <ButtonLabel>Continue</ButtonLabel>
</Button>

<Button nativeButton={true} type="button"
  variant="solid" tone="accent" size="md" shape="round"
  iconOnly={true} loading={false} aria-label="Continue">
  <ArrowRight aria-hidden="true" />
</Button>

<Button nativeButton={true} type="button"
  variant="ghost" tone="neutral" size="sm" shape="square"
  iconOnly={true} loading={false} aria-label="Continue"
  className="size-9 min-h-9 rounded-md hover:not-data-disabled:bg-muted pointer-coarse:size-11 pointer-coarse:min-h-11">
  <ArrowRight aria-hidden="true" />
</Button>`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2"><Button nativeButton={true} type="button" variant="ghost" tone="neutral" size="sm" shape="square" iconOnly={true} loading={false} aria-label="Squircle icon button" className={catalogIconButtonClassName}><ArrowRight aria-hidden="true" /></Button><span className="text-small text-muted-foreground">Squircle</span></div>
            <Button nativeButton={true} type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false}><ArrowRight aria-hidden="true" /><ButtonLabel>Leading icon</ButtonLabel></Button>
            <Button nativeButton={true} type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false}><ButtonLabel>Trailing icon</ButtonLabel><ArrowRight aria-hidden="true" /></Button>
            <Button nativeButton={true} type="button" variant="solid" tone="danger" size="md" shape="square" iconOnly={false} loading={false}><Trash aria-hidden="true" /><ButtonLabel>Delete item</ButtonLabel></Button>
            <Button nativeButton={true} type="button" variant="solid" tone="accent" size="md" shape="round" iconOnly={true} loading={false} aria-label="Continue"><ArrowRight aria-hidden="true" /></Button>
            <Button nativeButton={true} type="button" variant="outline" tone="neutral" size="md" shape="round" iconOnly={false} loading={false}><ButtonLabel>Round</ButtonLabel></Button>
            <Button nativeButton={false} render={<a href="#card" />} variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false}><ButtonLabel>Explore Card</ButtonLabel></Button>
          </div>
        </CatalogExample>

        <CatalogExample title="States" description="Tab through the examples to see keyboard focus. Loading blocks activation; disabled adds the muted treatment." code={`<Button nativeButton={true} type="button"
  variant="solid" tone="accent" size="md" shape="square"
  iconOnly={false} loading={true} disabled={false}>
  <ButtonLabel>Execute</ButtonLabel>
</Button>
// Loading and disabled can be set independently.`}>
          <div className="flex flex-wrap items-start gap-6">
            {(["Default", "Loading", "Disabled"] as const).map(state => (
              <div key={state} role="group" aria-label={`${state} button example`} className="flex flex-col items-start gap-3">
                <Button nativeButton={true} type="button" variant="solid" tone="accent" size="md" shape="square" iconOnly={false} loading={state === "Loading"} disabled={state === "Disabled"}><ButtonLabel>Execute</ButtonLabel></Button>
                <p className="text-small text-muted-foreground">{state}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-6">
            <div role="group" aria-label="Loading transition example" className="space-y-3">
              <p className="text-ui text-muted-foreground">Loading</p>
              <ButtonLoadingExample disabledWhileLoading={false} />
            </div>
            <div role="group" aria-label="Disabled loading transition example" className="space-y-3">
              <p className="text-ui text-muted-foreground">Loading + disabled</p>
              <ButtonLoadingExample disabledWhileLoading />
            </div>
          </div>
          <p className="mt-4 text-small text-muted-foreground">Try a 1.5-second action. Each button returns to idle automatically.</p>
        </CatalogExample>

        <CatalogExample title="Hold to delete" code={`<HoldButton duration={2000} size="md" shape="square"
  tone="danger" onHoldComplete={() => setDeleted(true)}>
  <Trash aria-hidden="true" />
  <ButtonLabel>Hold to delete</ButtonLabel>
</HoldButton>`}>
          <ButtonHoldExample />
        </CatalogExample>

        <div>
          <h3 className="font-sans text-ui font-medium normal-case text-muted-foreground">Playground</h3>
          <p className="mt-2 text-ui text-muted-foreground">Use Controls to explore appearance, states, and press feedback.</p>
          <ButtonPlayground />
        </div>
      </div>
    </Section>
  );
}

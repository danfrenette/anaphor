import { Button, ButtonLabel, Text, ThemeToggle } from "@anaphor/system";
import { ArrowRight, ArrowCircleRight } from "@phosphor-icons/react/dist/ssr";

const treatments = [
  { name: "Equal padding", reduction: 0 },
  { name: "2px tighter · Adopted", reduction: 2 },
  { name: "4px tighter", reduction: 4 },
] as const;

export default function ButtonPaddingPreview() {
  return <main className="mx-auto max-w-5xl px-6 py-10">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Text as="h1" variant="title">Button padding</Text>
      <ThemeToggle>Switch theme</ThemeToggle>
    </div>
    <Text as="p" variant="description" className="mt-3">
      Compare equal padding with a smaller inset on the icon side. The shared button now uses the 2px reduction. Equal padding and 4px samples remain here for comparison.
    </Text>
    {(["square", "round"] as const).map(shape => <section key={shape} className="mt-10" aria-label={`${shape} buttons`}>
      <Text as="h2" variant="heading">{shape === "square" ? "Rounded corners" : "Pill shape"}</Text>
      <div className="mt-5 grid gap-8 md:grid-cols-3">
        {treatments.map(({ name, reduction }) => <div key={name} className="border-t border-border pt-4">
          <Text as="h3" variant="ui">{name}</Text>
          <Text as="p" variant="caption" className="mt-1">Text side 14px · Icon side {14 - reduction}px</Text>
          <div className="mt-5 flex flex-col items-start gap-4">
            <Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape={shape} iconOnly={false} loading={false} style={reduction === 2 ? undefined : { paddingInlineStart: 14, paddingInlineEnd: 14 - reduction }}>
              <ButtonLabel>Continue</ButtonLabel><ArrowRight aria-hidden="true" />
            </Button>
            <Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape={shape} iconOnly={false} loading={false} style={reduction === 2 ? undefined : { paddingInlineStart: 14, paddingInlineEnd: 14 - reduction }}>
              <ButtonLabel>Continue</ButtonLabel><ArrowCircleRight weight="fill" aria-hidden="true" />
            </Button>
            <Button nativeButton type="button" variant="solid" tone="neutral" size="md" shape={shape} iconOnly={false} loading={false} style={reduction === 2 ? undefined : { paddingInlineStart: 14 - reduction, paddingInlineEnd: 14 }}>
              <ArrowRight aria-hidden="true" /><ButtonLabel>Continue</ButtonLabel>
            </Button>
          </div>
        </div>)}
      </div>
    </section>)}
    <Text as="p" variant="caption" className="mt-10">All samples use the medium button size, the same label, and the existing 8px icon gap.</Text>
  </main>;
}

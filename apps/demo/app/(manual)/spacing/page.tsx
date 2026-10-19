import { Text } from "@anaphor/system";
import { FoundationPage, readFoundationTokens } from "../foundations/visual-reference";
import { requireToken } from "../foundations/tokens";

export const metadata = { title: "Spacing · Anaphor" };

const steps = [1, 2, 3, 4, 6, 8, 12, 16, 24] as const;

export default async function SpacingPage() {
  const tokens = await readFoundationTokens();
  const baseRem = Number.parseFloat(requireToken(tokens, "--spacing"));
  return (
    <FoundationPage title="Spacing" description="A 4px base connects compact controls to spacious reading layouts. Use Tailwind’s existing numbers for gaps and padding.">
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3 text-ui">
        <Text as="h2" variant="ui" className="font-medium">The documented rhythm</Text>
        <Text as="code" variant="code" className="text-muted-foreground">--spacing: {requireToken(tokens, "--spacing")}</Text>
      </div>
      <ol className="mt-4 divide-y divide-border border-y border-border">
        {steps.map(step => (
          <li key={step} className="grid grid-cols-[4rem_1fr_3rem] items-center gap-4 py-4">
            <Text as="code" variant="code">gap-{step}</Text>
            <div aria-hidden="true" className="h-4 bg-primary" style={{ width: `calc(var(--spacing) * ${step})` }} />
            <Text as="span" variant="caption" className="text-end tabular-nums">{step * baseRem * 16}px</Text>
          </li>
        ))}
      </ol>
      <Text as="p" variant="caption" className="mt-3">Pixel equivalents use the default 16px root size. The bars use the live spacing token. These are preferred steps, not a restriction on Tailwind’s available utilities.</Text>
      <section className="mt-12">
        <Text as="h2" variant="heading">Space in context</Text>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <figure>
            <div className="bg-muted p-6"><div className="border border-dashed border-border bg-background p-4 text-ui">Content</div></div>
            <figcaption className="mt-4 text-ui">Padding <code className="font-mono text-muted-foreground">p-6</code><Text as="p" variant="caption" className="mt-2">24px around a card’s content.</Text></figcaption>
          </figure>
          <figure>
            <div className="flex min-h-28 items-center gap-4 bg-muted p-6"><div className="h-12 flex-1 bg-background" /><div className="h-12 flex-1 bg-background" /></div>
            <figcaption className="mt-4 text-ui">Gap <code className="font-mono text-muted-foreground">gap-4</code><Text as="p" variant="caption" className="mt-2">16px between related fields or examples.</Text></figcaption>
          </figure>
        </div>
      </section>
      <section className="mt-12 border-t border-border pt-6">
        <Text as="h2" variant="heading">From controls to sections</Text>
        <Text as="p" variant="body" className="mt-3">Keep space compact within controls, moderate within a demo, and generous between instructional sections. Use shared alignment and whitespace to group content before adding containers.</Text>
        <Text as="p" variant="body" className="mt-4">The shared <code className="font-mono text-ui">px-page-inset</code> follows the responsive page gutter, capped at 3rem. At the default root size it gives 24px below 640px and 48px from 640px. Wider manual compositions may use the uncapped gutter.</Text>
      </section>
    </FoundationPage>
  );
}

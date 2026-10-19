import { Text } from "@anaphor/system";
import { FoundationPage, FoundationSample, readFoundationTokens } from "../foundations/visual-reference";
import { requireToken } from "../foundations/tokens";

export const metadata = { title: "Radius · Anaphor" };

const radii = [
  { name: "Small", token: "--radius-sm", utility: "rounded-sm", purpose: "Structural surfaces and code blocks." },
  { name: "Medium", token: "--radius-md", utility: "rounded-md", purpose: "Compact surfaces and navigation highlights." },
  { name: "Control", token: "--radius-control", utility: "rounded-control", purpose: "Tactile controls, inputs, and menus." },
  { name: "Card", token: "--radius-card", utility: "rounded-card", purpose: "Cards and floating tools." },
] as const;

export default async function RadiusPage() {
  const tokens = await readFoundationTokens();
  return (
    <FoundationPage title="Radius" description="Four named corners, each with a job. Structure stays restrained; controls and movable surfaces earn softer geometry.">
      <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2">
        {radii.map(({ name, token, utility, purpose }) => (
          <FoundationSample key={token} name={name} token={utility} description={`${requireToken(tokens, token)} · ${purpose}`}>
            <div aria-hidden="true" className="size-24 border border-foreground/30 bg-background" style={{ borderRadius: `var(${token})` }} />
          </FoundationSample>
        ))}
      </div>
      <div className="mt-12 border-t border-border pt-6">
        <Text as="h2" variant="heading">Square and round</Text>
        <Text as="p" variant="body" className="mt-3">Square corners remain the default for flat structure. Fully rounded shapes are reserved for pills and indicators when their shape communicates behavior. These are endpoint treatments, not additional Anaphor radius steps.</Text>
        <div aria-hidden="true" className="mt-6 flex items-center gap-8">
          <div className="size-16 border border-border bg-muted" />
          <div className="h-12 w-24 rounded-full border border-border bg-muted" />
        </div>
      </div>
    </FoundationPage>
  );
}

import { Text } from "@anaphor/system";
import { FoundationPage, FoundationSample } from "../foundations/visual-reference";

export const metadata = { title: "Shadows · Anaphor" };

const elevations = [
  { name: "Flat", token: "shadow-none", shadow: "none", purpose: "Page structure stays on the canvas without elevation." },
  { name: "Card", token: "shadow-card", shadow: "var(--anaphor-shadow-card)", purpose: "A fine keyline with a compact near shadow and soft falloff." },
  { name: "Menu", token: "--anaphor-shadow-menu", shadow: "var(--anaphor-shadow-menu)", purpose: "A deeper shadow separates temporary menus and popovers from their surroundings." },
] as const;

const uploadShadows = [
  { name: "Upload surface", token: "shadow-upload", shadow: "--anaphor-shadow-upload" },
  { name: "Upload action", token: "shadow-upload-action", shadow: "--anaphor-shadow-upload-action" },
  { name: "Upload action hover", token: "shadow-upload-action-hover", shadow: "--anaphor-shadow-upload-action-hover" },
] as const;

export default function ShadowsPage() {
  return (
    <FoundationPage title="Shadows" description="Elevation follows purpose. Compare the shipped treatments on the same surface; use the theme switch to see how they adapt.">
      <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-3">
        {elevations.map(({ name, token, shadow, purpose }) => (
          <FoundationSample key={name} name={name} token={token} description={purpose}>
            <div aria-hidden="true" className="h-20 w-full max-w-32 rounded-card bg-background" style={{ boxShadow: shadow }} />
          </FoundationSample>
        ))}
      </div>
      <section className="mt-12 border-t border-border pt-6">
        <Text as="h2" variant="heading">Upload treatments</Text>
        <Text as="p" variant="body" className="mt-3">The upload surface and its actions have dedicated shadows. In dark mode these become subtle light keylines. They are component-specific treatments, not extra levels in a general elevation scale.</Text>
        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-3">
          {uploadShadows.map(({ name, token, shadow }) => (
            <FoundationSample key={token} name={name} token={token} description="Used by the file-upload composition.">
              <div aria-hidden="true" className="h-20 w-full max-w-32 rounded-card bg-background" style={{ boxShadow: `var(${shadow})` }} />
            </FoundationSample>
          ))}
        </div>
      </section>
      <section className="mt-12 border-t border-border pt-6">
        <Text as="h2" variant="heading">Clipped surfaces</Text>
        <Text as="p" variant="body" className="mt-3">The morphing control surface uses <code className="break-words font-mono text-ui">--anaphor-filter-shadow-card</code> to follow its clipped shape. It shares the card shadow’s primitives and represents the same elevation.</Text>
      </section>
    </FoundationPage>
  );
}

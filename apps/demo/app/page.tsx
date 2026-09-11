import { Prose, Text, Card, CardContent, CardHeader, CardTitle, Separator } from "@anaphor/system";
import { PlaygroundHost } from "./playground-host";
import { ButtonDemo } from "./button-demo";
import { BadgeDemo } from "./badge-demo";
import { NodeEdgeDemo } from "./node-edge-demo";
import { CardDemo } from "./card-demo";
import { CheckboxDemo } from "./checkbox-demo";
import { InputDemo } from "./input-demo";

const index = [
  {
    label: "00 / Introduction",
    links: [
      ["Purpose", "#purpose"],
      ["Principles", "#principles"],
    ],
  },
  {
    label: "01 / Foundations",
    links: [
      ["Color", "#color"],
      ["Typography", "#typography"],
      ["Motion", "#motion"],
    ],
  },
  {
    label: "02 / Controls",
    links: [["Button", "#button"], ["Input", "#input"], ["Checkbox", "#checkbox"]],
  },
  {
    label: "03 / Components",
    links: [["Card", "#card"], ["Badge", "#badge"], ["Node-edge graphs", "#node-edge-graphs"]],
  },
  {
    label: "04 / Studies",
    links: [["Visual studies", "/studies"]],
  },
] as const;

const neutralRoles = [
  ["Font / tertiary", "--anaphor-font-tertiary"],
  ["Font / secondary", "--anaphor-font-secondary"],
  ["Input / disabled", "--anaphor-input-disabled"],
  ["Input / border", "--anaphor-input-border"],
  ["Foreground", "--anaphor-foreground"],
  ["Background", "--anaphor-background"],
] as const;

const chromaticRoles = [
  ["Brand", "--anaphor-brand", "oklch(0.6217 0.185 39.44)"],
  ["Focus", "--anaphor-focus", "oklch(0.618 0.161 39.44)"],
  ["Danger", "--anaphor-danger", "oklch(0.4852 0.1691 10.14)"],
  ["Danger / hover", "--anaphor-danger-hover", "oklch(0.4236 0.1691 10.14)"],
  ["Danger / text", "--anaphor-danger-text", "oklch(0.4236 0.1691 10.14)"],
] as const;

const colorRoles = [
  ...neutralRoles,
  ...chromaticRoles.map(([label, token]) => [label, token] as const),
] as const;

export default function HomePage() {
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[280px_1fr]">
      <a
        href="#content"
        className="fixed top-3 left-3 z-50 -translate-y-20 bg-foreground px-3 py-2 text-ui text-background focus-visible:translate-y-0"
      >
        Skip to content
      </a>

      <aside className="border-b border-border px-6 py-8 lg:sticky lg:top-0 lg:h-svh lg:border-r lg:border-b-0 lg:px-12 lg:py-12">
        <div className="flex items-center gap-2.5 text-xs font-normal tracking-[0.04em]">
          <span className="size-3.5 rounded-sm bg-primary" aria-hidden="true" />
          SYSTEM / 01
        </div>

        <nav aria-label="Manual index" className="mt-12 lg:mt-20">
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1 lg:gap-9">
            {index.map((group) => (
              <li key={group.label}>
                <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">
                  {group.label}
                </p>
                <ul className="mt-2 grid gap-1">
                  {group.links.map(([label, href]) => (
                    <li key={href}>
                      <a
                        href={href}
                        className="flex min-h-8 items-center text-ui text-muted-foreground hover:text-foreground"
                      >
                        <span className="w-[18px] shrink-0" aria-hidden="true" />
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12 hidden lg:block">
          <Separator />
          <p className="pt-6 text-label text-muted-foreground">
            LIGHT / 100%
          </p>
        </div>
      </aside>

      <main
        id="content"
        tabIndex={-1}
        className="min-w-0 px-6 py-12 sm:px-12 lg:px-20 lg:py-14"
      >
        <article className="mx-auto max-w-[840px]">
          <header id="purpose" className="scroll-mt-8 pb-10">
            <div className="flex items-center justify-between gap-6 text-label tracking-[0.08em] text-muted-foreground uppercase">
              <p>00.01 / Contract</p>
              <p>Status / Draft</p>
            </div>
            <Text as="h1" variant="display" className="mt-10">
              Anaphor
            </Text>
            <Text className="mt-3 max-w-[65ch] text-pretty">
              An executable manual for the decisions that make personal software
              coherent.
            </Text>
          </header>

          <Separator />

          <section id="principles" className="scroll-mt-8 py-12">
            <p className="text-label tracking-[0.08em] uppercase">
              Principles
            </p>
            <ol className="mt-6 divide-y divide-border border-y border-border">
              <li className="grid gap-2 py-5 sm:grid-cols-[48px_1fr]">
                <span className="text-label text-muted-foreground">01</span>
                <p className="text-body">Prove every rule in running software.</p>
              </li>
              <li className="grid gap-2 py-5 sm:grid-cols-[48px_1fr]">
                <span className="text-label text-muted-foreground">02</span>
                <p className="text-body">
                  Admit components only when a real composition needs them.
                </p>
              </li>
              <li className="grid gap-2 py-5 sm:grid-cols-[48px_1fr]">
                <span className="text-label text-muted-foreground">03</span>
                <p className="text-body">Borrow principles, not identity.</p>
              </li>
            </ol>
          </section>

          <section id="color" className="scroll-mt-8 py-12">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-label tracking-[0.08em] uppercase">
                  01.01 / Color
                </p>
                <Text as="h2" variant="heading" className="mt-3">
                  Theme roles
                </Text>
              </div>
              <p className="text-label text-muted-foreground">
                OKLCH / 11 ROLES
              </p>
            </div>

            <Text className="mt-4 max-w-[65ch] text-pretty">
              Six theme-aware neutrals carry type, structure, and disabled
              states. Five chromatic roles carry brand, focus, and danger. Danger text
              uses a lighter shade of the same OKLCH hue in dark mode.
              Component states derive from these values rather than introducing
              more tokens.
            </Text>

            <div className="mt-8 border-y border-border py-5">
              <div className="flex items-baseline justify-between gap-4">
                <Text as="h3" variant="label" className="uppercase">
                  Neutral roles
                </Text>
                <p className="text-label text-muted-foreground">06 roles</p>
              </div>
              <ol className="mt-3 grid gap-4 sm:grid-cols-3">
                {neutralRoles.map(([label, token]) => (
                  <li key={token}>
                    <Card>
                      <div className="grid grid-cols-2">
                        <div
                          className="h-14 rounded-tl-card"
                          style={{ backgroundColor: `var(${token})` }}
                          title="Light"
                        />
                        <div
                          className="dark h-14 rounded-tr-card"
                          style={{ backgroundColor: `var(${token})` }}
                          title="Dark"
                        />
                      </div>
                      <CardContent>
                        <p className="text-small font-medium">{label}</p>
                        <p className="mt-1 break-words font-mono text-label text-muted-foreground">
                          {token}
                        </p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-b border-border py-5">
              <div className="flex items-baseline justify-between gap-4">
                <Text as="h3" variant="label" className="uppercase">
                  Chromatic signals
                </Text>
                <p className="text-label text-muted-foreground">05 roles</p>
              </div>
              <ol className="mt-3 grid gap-4 sm:grid-cols-2">
                {chromaticRoles.map(([role, token, value]) => (
                  <li key={role}>
                    <Card>
                      <div
                        className="h-20 rounded-t-card"
                        style={{ backgroundColor: `var(${token})` }}
                      />
                      <CardContent>
                        <p className="text-small font-medium">{role}</p>
                        <p className="mt-1 break-words font-mono text-label text-muted-foreground">
                          {value}
                        </p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-8 grid items-start gap-6 sm:grid-cols-2">
              {["light", "dark"].map((theme) => (
                <Card
                  key={theme}
                  className={theme === "dark" ? "dark" : undefined}
                >
                  <CardHeader>
                    <CardTitle className="text-label tracking-[0.08em] uppercase font-normal">
                      {theme} roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y divide-border">
                      {colorRoles.map(([label, token]) => (
                        <li key={token} className="grid min-h-10 grid-cols-[20px_1fr] items-center gap-3 py-2">
                          <span
                            className="size-5 border border-border"
                            style={{ backgroundColor: `var(${token})` }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 sm:flex sm:items-baseline sm:justify-between sm:gap-3">
                            <p className="text-small font-medium">{label}</p>
                            <p className="break-words font-mono text-label text-muted-foreground">
                              {token}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator />

          <section id="typography" className="scroll-mt-8 py-12">
            <p className="text-label tracking-[0.08em] uppercase">
              01.02 / Typography
            </p>
            <Text as="h2" variant="heading" className="mt-3">Type with a purpose</Text>
            <div className="mt-6 grid gap-8 sm:grid-cols-[1fr_2fr]">
              <p className="text-label text-muted-foreground uppercase">
                Instructional measure
              </p>
              <Text className="max-w-[65ch]">
                Bell Gothic Black gives headings their voice. Inter carries the reading
                and interface text. Magda Clean Mono identifies literal values and code.
                Purpose sets the font, size, and rhythm.
              </Text>
            </div>
            <div className="mt-8 border-y border-border py-8">
              <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">Bell Gothic Black / 900</p>
              <Text as="p" variant="display" className="mt-4 max-w-[18ch]">A place for deliberate work.</Text>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {["light", "dark"].map((theme) => (
                <Card key={theme} className={theme === "dark" ? "dark" : undefined}>
                  <CardHeader>
                    <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">{theme} / Reading</p>
                    <CardTitle className="mt-3">Room to think</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Prose aria-label={`${theme} article example`}>
                      <p>Good interfaces leave room for the work. A clear heading establishes the subject; a steady rhythm carries the details. <strong>Emphasis has a purpose.</strong> The rest can feel <em>quiet and considered.</em></p>
                      <h3>A steady reading rhythm</h3>
                      <p>Article text shares one reading color, including <a href="#typography">links</a>, lists, and <code>inline code</code>.</p>
                      <ul><li>Give each idea room.</li><li>Keep nested <strong>emphasis</strong> at the same text opacity.</li></ul>
                      <blockquote><p>Clear typography lets the writing lead.</p></blockquote>
                    </Prose>
                    <div className="mt-6 flex items-baseline justify-between gap-3 border-t border-border pt-4 text-ui">
                      <span className="font-medium">Reading progress</span>
                      <span className="font-mono tabular-nums">08 / 24</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section id="motion" className="scroll-mt-8 border-t border-border py-12">
            <p className="text-label tracking-[0.08em] uppercase">
              01.03 / Motion
            </p>
            <Text className="mt-6 max-w-[65ch] text-pretty">
              Motion explains feedback, causality, continuity, or spatial
              relationships. If it explains none of these, remove it.
            </Text>
          </section>

          <PlaygroundHost>
            <ButtonDemo />
            <CardDemo />
            <BadgeDemo />
            <NodeEdgeDemo />
            <InputDemo />
            <CheckboxDemo />
          </PlaygroundHost>
        </article>
      </main>
    </div>
  );
}

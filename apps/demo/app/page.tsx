import { DemoControlsProvider } from "./demo-controls";
import { Card, CardContent, CardHeader, CardTitle, Separator } from "@design-language/system";
import { ButtonDemo } from "./button-demo";
import { CardDemo } from "./card-demo";

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
    links: [["Button", "#button"]],
  },
  {
    label: "03 / Components",
    links: [["Card", "#card"]],
  },
] as const;

const neutralRoles = [
  ["Font / tertiary", "--dl-font-tertiary"],
  ["Font / secondary", "--dl-font-secondary"],
  ["Input / disabled", "--dl-input-disabled"],
  ["Input / border", "--dl-input-border"],
  ["Foreground", "--dl-foreground"],
  ["Background", "--dl-background"],
] as const;

const chromaticRoles = [
  ["Brand", "--dl-brand", "oklch(0.6217 0.185 39.44)"],
  ["Focus", "--dl-focus", "oklch(0.618 0.161 39.44)"],
  ["Danger", "--dl-danger", "oklch(0.4852 0.1691 10.14)"],
  ["Danger / text", "--dl-danger-text", "oklch(0.4236 0.1691 10.14)"],
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
        <div className="flex items-center gap-2.5 font-mono text-xs font-medium tracking-[0.04em]">
          <span className="size-3.5 rounded-sm bg-primary" aria-hidden="true" />
          SYSTEM / 01
        </div>

        <nav aria-label="Manual index" className="mt-12 lg:mt-20">
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1 lg:gap-9">
            {index.map((group) => (
              <li key={group.label}>
                <p className="font-mono text-label tracking-[0.08em] text-muted-foreground uppercase">
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
          <p className="pt-6 font-mono text-label text-muted-foreground">
            LIGHT / 100%
          </p>
        </div>
      </aside>

      <main
        id="content"
        tabIndex={-1}
        className="px-6 py-12 sm:px-12 lg:px-20 lg:py-14"
      >
        <article className="mx-auto max-w-[840px]">
          <header id="purpose" className="scroll-mt-8 pb-10">
            <div className="flex items-center justify-between gap-6 font-mono text-label tracking-[0.08em] text-muted-foreground uppercase">
              <p>00.01 / Contract</p>
              <p>Status / Draft</p>
            </div>
            <h1 className="mt-10 text-title font-medium tracking-[-0.02em]">
              Design language
            </h1>
            <p className="mt-3 max-w-[70ch] text-body text-muted-foreground">
              An executable manual for the decisions that make personal software
              coherent.
            </p>
          </header>

          <Separator />

          <section id="principles" className="scroll-mt-8 py-12">
            <p className="font-mono text-label tracking-[0.08em] uppercase">
              Principles
            </p>
            <ol className="mt-6 divide-y divide-border border-y border-border">
              <li className="grid gap-2 py-5 sm:grid-cols-[48px_1fr]">
                <span className="font-mono text-label text-muted-foreground">01</span>
                <p className="text-body">Prove every rule in running software.</p>
              </li>
              <li className="grid gap-2 py-5 sm:grid-cols-[48px_1fr]">
                <span className="font-mono text-label text-muted-foreground">02</span>
                <p className="text-body">
                  Admit components only when a real composition needs them.
                </p>
              </li>
              <li className="grid gap-2 py-5 sm:grid-cols-[48px_1fr]">
                <span className="font-mono text-label text-muted-foreground">03</span>
                <p className="text-body">Borrow principles, not identity.</p>
              </li>
            </ol>
          </section>

          <section id="color" className="scroll-mt-8 py-12">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="font-mono text-label tracking-[0.08em] uppercase">
                  01.01 / Color
                </p>
                <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em]">
                  Theme roles
                </h2>
              </div>
              <p className="font-mono text-label text-muted-foreground">
                OKLCH / 10 ROLES
              </p>
            </div>

            <p className="mt-4 max-w-[68ch] text-ui text-muted-foreground">
              Six theme-aware neutrals carry type, structure, and disabled
              states. Four shared chromatic roles carry brand, focus, and danger.
              Component states derive from these values rather than introducing
              more tokens.
            </p>

            <div className="mt-8 border-y border-border py-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-mono text-label tracking-[0.08em] uppercase">
                  Neutral roles
                </h3>
                <p className="font-mono text-label text-muted-foreground">06 roles</p>
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
                        <p className="mt-1 truncate font-mono text-label text-muted-foreground">
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
                <h3 className="font-mono text-label tracking-[0.08em] uppercase">
                  Chromatic signals
                </h3>
                <p className="font-mono text-label text-muted-foreground">04 roles</p>
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
                        <p className="mt-1 truncate font-mono text-label text-muted-foreground">
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
                    <CardTitle className="font-mono text-label tracking-[0.08em] uppercase">
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
                            <p className="truncate font-mono text-label text-muted-foreground">
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
            <p className="font-mono text-label tracking-[0.08em] uppercase">
              01.02 / Typography
            </p>
            <div className="mt-6 grid gap-8 sm:grid-cols-[1fr_2fr]">
              <p className="font-mono text-label text-muted-foreground uppercase">
                Instructional measure
              </p>
              <p className="max-w-[70ch] text-body">
                Sans carries prose and controls. Mono identifies indexes,
                measurements, state labels, and code. Hierarchy comes from
                weight, scale, and space before decoration.
              </p>
            </div>
          </section>

          <section id="motion" className="scroll-mt-8 border-t border-border py-12">
            <p className="font-mono text-label tracking-[0.08em] uppercase">
              01.03 / Motion
            </p>
            <p className="mt-6 max-w-[70ch] text-body text-muted-foreground">
              Motion explains feedback, causality, continuity, or spatial
              relationships. If it explains none of these, remove it.
            </p>
          </section>

          <DemoControlsProvider>
            <ButtonDemo />
            <CardDemo />
          </DemoControlsProvider>
        </article>
      </main>
    </div>
  );
}

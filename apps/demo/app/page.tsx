import { Separator } from "@design-language/system";

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
] as const;

const colors = [
  ["Canvas", "--dl-color-canvas", "bg-background"],
  ["Surface", "--dl-color-surface", "bg-muted"],
  ["Text", "--dl-color-text", "bg-foreground"],
  ["Border", "--dl-color-border", "bg-border"],
  ["Accent", "--dl-color-accent", "bg-primary"],
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
                  Semantic roles
                </h2>
              </div>
              <p className="font-mono text-label text-muted-foreground">
                05 VALUES
              </p>
            </div>

            <ul className="mt-6 grid border border-border bg-muted sm:grid-cols-5">
              {colors.map(([label, token, className]) => (
                <li
                  key={token}
                  className="border-b border-border p-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
                >
                  <div className={`h-16 border border-border ${className}`} />
                  <p className="mt-3 text-ui font-medium">{label}</p>
                  <p className="mt-1 overflow-hidden font-mono text-label text-ellipsis whitespace-nowrap text-muted-foreground">
                    {token}
                  </p>
                </li>
              ))}
            </ul>
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
        </article>
      </main>
    </div>
  );
}

import { SidebarInsetContent, Section, Prose, Text, Card, CardContent, CardHeader, CardTitle, Separator } from "@anaphor/system";
import { ButtonDemo } from "./button-demo";
import { BadgeDemo } from "./badge-demo";
import { NodeEdgeDemo } from "./node-edge-demo";
import { CardDemo } from "./card-demo";
import { CheckboxDemo } from "./checkbox-demo";
import { InputDemo } from "./input-demo";
import { CommandPaletteDemo } from "./command-palette-demo";
import { DropdownMenuDemo } from "./dropdown-menu-demo";
import { TooltipDemo } from "./tooltip-demo";
import { DataTableDemo } from "./data-table-demo";
import { PopoverDemo } from "./popover-demo";
import { KbdDemo } from "./kbd-demo";
import { SliderDemo } from "./slider-demo";
import { SkeletonDemo } from "./skeleton-demo";
import { TabsDemo } from "./tabs-demo";

const neutralRoles = [
  ["Font / tertiary", "--anaphor-font-tertiary"],
  ["Font / secondary", "--anaphor-font-secondary"],
  ["Input / disabled", "--anaphor-input-disabled"],
  ["Input / border", "--anaphor-input-border"],
  ["Foreground", "--anaphor-foreground"],
  ["Background", "--anaphor-background"],
] as const;

const chromaticRoles = [
  ["Brand", "--anaphor-brand"],
  ["Focus", "--anaphor-focus"],
  ["Danger", "--anaphor-danger"],
  ["Danger / text", "--anaphor-danger-text"],
] as const;

const colorRoles = [
  ...neutralRoles,
  ...chromaticRoles.map(([label, token]) => [label, token] as const),
] as const;

export default function HomePage() {
  return (
    <main
      id="content"
      tabIndex={-1}
      className="min-w-0 px-[var(--anaphor-page-gutter)] py-12 lg:py-14"
    >
      <SidebarInsetContent className="mx-auto max-w-[840px]">
        <article>
          <Section as="header" id="purpose" className="pb-10">
            <div className="flex items-center justify-between gap-6 text-label tracking-[0.08em] text-muted-foreground uppercase">
              <p>00.01 / Contract</p>
              <p>Status / Draft</p>
            </div>
            <Text as="h1" variant="display" className="mt-10">
              Anaphor
            </Text>
            <Text as="p" variant="description" className="mt-3">
              An executable manual for the decisions that make personal software
              coherent.
            </Text>
          </Section>

          <Separator orientation="horizontal" />

          <Section id="principles" className="py-12">
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
          </Section>

          <Section id="color" className="py-12">
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
                OKLCH / {colorRoles.length} ROLES
              </p>
            </div>

            <Text as="p" variant="description" className="mt-4">
              Six theme-aware neutrals carry type, structure, and disabled
              states. Chromatic roles carry brand, focus, and danger. Danger text
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
                    <Card variant="default">
                      <div className="h-14 rounded-t-card" style={{ backgroundColor: `var(${token})` }} />
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
                <p className="text-label text-muted-foreground">{String(chromaticRoles.length).padStart(2, "0")} roles</p>
              </div>
              <ol className="mt-3 grid gap-4 sm:grid-cols-2">
                {chromaticRoles.map(([role, token]) => (
                  <li key={role}>
                    <Card variant="default">
                      <div
                        className="h-20 rounded-t-card"
                        style={{ backgroundColor: `var(${token})` }}
                      />
                      <CardContent>
                        <p className="text-small font-medium">{role}</p>
                        <p className="mt-1 break-words font-mono text-label text-muted-foreground">
                          {token}
                        </p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-8">
              <Card variant="default">
                <CardHeader>
                  <CardTitle as="h3" variant="label">
                    Color roles
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
            </div>
          </Section>

          <Separator orientation="horizontal" />

          <Section id="typography" className="py-12">
            <p className="text-label tracking-[0.08em] uppercase">
              01.02 / Typography
            </p>
            <Text as="h2" variant="heading" className="mt-3">Type with a purpose</Text>
            <div className="mt-6 grid gap-8 sm:grid-cols-[1fr_2fr]">
              <p className="text-label text-muted-foreground uppercase">
                Instructional measure
              </p>
              <Text as="p" variant="body">
                Bell Gothic Black gives headings their voice. Inter carries the reading
                and interface text. Magda Clean Mono identifies literal values and code.
                Purpose sets the font, size, and rhythm.
              </Text>
            </div>
            <div className="mt-8 border-y border-border py-8">
              <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">Bell Gothic Black / 900</p>
              <Text as="p" variant="display" className="mt-4 max-w-[18ch]">A place for deliberate work.</Text>
              <Text as="p" variant="caption" className="mt-4">Headings balance their lines. Body copy keeps a steady reading measure.</Text>
            </div>
            <div className="mt-8">
              <Card variant="default">
                <CardHeader>
                  <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">Reading</p>
                  <CardTitle as="h3" variant="heading" className="mt-3">Room to think</CardTitle>
                </CardHeader>
                <CardContent>
                  <Prose as="div" aria-label="Article example">
                    <p>Good interfaces leave room for the work. A clear heading establishes the subject; a steady rhythm carries the details. <strong>Emphasis has a purpose.</strong> The rest can feel <em>quiet and considered.</em></p>
                    <h3>A steady reading rhythm</h3>
                    <p>Article text shares one reading color, including <a href="#typography">links</a>, lists, and <code>inline code</code>.</p>
                    <ul><li>Give each idea room.</li><li>Keep nested <strong>emphasis</strong> at the same text opacity.</li></ul>
                    <blockquote><p>Clear typography lets the writing lead.</p></blockquote>
                  </Prose>
                  <div className="mt-6 flex items-baseline justify-between gap-3 border-t border-border pt-4 text-ui">
                    <Text as="span" variant="ui">Reading progress</Text>
                    <span className="font-mono tabular-nums">08 / 24</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section id="motion" className="border-t border-border py-12">
            <p className="text-label tracking-[0.08em] uppercase">
              01.03 / Motion
            </p>
            <Text as="p" variant="description" className="mt-6">
              Motion explains feedback, causality, continuity, or spatial
              relationships. If it explains none of these, remove it.
            </Text>
          </Section>

          <ButtonDemo />
          <CardDemo />
          <BadgeDemo />
          <NodeEdgeDemo />
          <SkeletonDemo />
          <InputDemo />
          <SliderDemo />
          <CheckboxDemo />
          <DropdownMenuDemo />
          <PopoverDemo />
          <TooltipDemo />
          <DataTableDemo />
          <KbdDemo />
          <TabsDemo />
          <CommandPaletteDemo />
        </article>
      </SidebarInsetContent>
    </main>
  );
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { Text } from "@anaphor/system";
import { extractInventory } from "./inventory";

export async function readFoundationTokens() {
  const css = await readFile(path.resolve(process.cwd(), "../../packages/design-system/src/styles-base.css"), "utf8");
  return extractInventory(css).tokens;
}

export function FoundationPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main id="content" tabIndex={-1} className="min-w-0 px-page-inset py-12">
      <div className="mx-auto max-w-[840px]">
        <div className="border-b border-border pb-8">
          <Text as="h1" variant="title">{title}</Text>
          <Text as="p" variant="description" className="mt-3">{description}</Text>
        </div>
        {children}
      </div>
    </main>
  );
}

export function FoundationSample({ name, token, description, children }: { name: string; token: string; description: string; children: ReactNode }) {
  return (
    <figure className="min-w-0">
      <div className="flex h-44 items-center justify-center bg-muted p-8">{children}</div>
      <figcaption className="pt-4">
        <Text as="h2" variant="ui" className="font-medium">{name}</Text>
        <Text as="code" variant="code" className="mt-1 block break-words text-muted-foreground">{token}</Text>
        <Text as="p" variant="caption" className="mt-2">{description}</Text>
      </figcaption>
    </figure>
  );
}

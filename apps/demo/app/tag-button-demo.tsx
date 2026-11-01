import { ButtonLabel, Section, TagButton, Text } from "@anaphor/system";
import { ArrowUpRight, Plus, X } from "@phosphor-icons/react/dist/ssr";
import { CatalogExample } from "./catalog-example";
import { TagButtonActions } from "./tag-button-actions";

export function TagButtonDemo() {
  return <Section id="tag-button" className="border-t border-border py-12">
    <Text as="h2" variant="title">Tag button</Text>
    <Text as="p" variant="description" className="mt-3">An action pill with Button behavior and Badge-like wrapping. Each pill is one action; its label and icons describe what happens.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Tag actions" description="Add or remove a tag, or inspect where an inherited tag came from." code={`<TagButton size="xs" tone="neutral" variant="soft" loading={false}
  aria-label="Remove Research" onClick={removeTag}>
  <ButtonLabel>Research</ButtonLabel><X aria-hidden="true" />
</TagButton>
<TagButton size="xs" tone="neutral" variant="outline" loading={false}
  aria-label="Add Analysis" onClick={addTag}>
  <Plus aria-hidden="true" /><ButtonLabel>Analysis</ButtonLabel>
</TagButton>
<TagButton size="xs" tone="neutral" variant="soft" loading={false}
  onClick={inspectOrigin}>
  <ButtonLabel>Methods from Research notes</ButtonLabel>
  <ArrowUpRight aria-hidden="true" />
</TagButton>`}>
        <TagButtonActions />
      </CatalogExample>
      <CatalogExample title="States" code={`<TagButton size="xs" tone="neutral" variant="outline" loading={false} disabled>
  <ButtonLabel>Unavailable</ButtonLabel>
</TagButton>
<TagButton size="xs" tone="neutral" variant="soft" loading={true}>
  <ButtonLabel>Updating</ButtonLabel>
</TagButton>`}>
        <div className="flex flex-wrap items-start gap-2">
          <TagButton size="xs" tone="neutral" variant="outline" loading={false} disabled><ButtonLabel>Unavailable</ButtonLabel></TagButton>
          <TagButton size="xs" tone="neutral" variant="soft" loading={true}><ButtonLabel>Updating</ButtonLabel></TagButton>
        </div>
      </CatalogExample>
      <CatalogExample title="Long labels" description="Labels and origin text wrap inside the available width. Icons remain separate from the text." code={`<TagButton size="sm" tone="neutral" variant="soft" loading={false} className="px-4">
  <ButtonLabel>Research methods from Introduction to experimental design</ButtonLabel>
  <ArrowUpRight aria-hidden="true" />
</TagButton>`}>
        <div className="flex max-w-xs flex-wrap items-start gap-2">
          <TagButton size="sm" tone="neutral" variant="soft" loading={false} className="px-4">
            <ButtonLabel>Research methods <span className="font-normal">from Introduction to experimental design</span></ButtonLabel>
            <ArrowUpRight aria-hidden="true" />
          </TagButton>
          <TagButton size="xs" tone="neutral" variant="outline" loading={false} className="px-4" aria-label="Add interdisciplinaryresearchmethodologyandexperimentaldesign">
            <Plus aria-hidden="true" /><ButtonLabel>interdisciplinaryresearchmethodologyandexperimentaldesign</ButtonLabel>
          </TagButton>
          <TagButton size="xs" tone="neutral" variant="soft" loading={false} aria-label="Remove Reading notes"><ButtonLabel>Reading notes</ButtonLabel><X aria-hidden="true" /></TagButton>
        </div>
      </CatalogExample>
    </div>
  </Section>;
}

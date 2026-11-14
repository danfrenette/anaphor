import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbCurrent, BreadcrumbSeparator, Section, Text } from "@anaphor/system";
import { CatalogExample } from "./catalog-example";
import { BreadcrumbBrowser } from "./breadcrumb-browser";

export function BreadcrumbDemo() {
  return <Section id="breadcrumb" className="border-t border-border py-12">
    <Text as="h2" variant="title">Breadcrumb</Text>
    <Text as="p" variant="description" className="mt-3">A path through pages or nested content. Compose links for destinations and buttons for browsing in place.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Link navigation" description="The current location is plain text. Each separator belongs to its following item, outside the target." code={`<Breadcrumb aria-label="Page path">
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">Manual</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbSeparator>/</BreadcrumbSeparator>
      <BreadcrumbCurrent aria-current="page">Breadcrumb</BreadcrumbCurrent>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`}>
        <Breadcrumb aria-label="Page path"><BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/#purpose">Manual</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbItem><BreadcrumbSeparator>/</BreadcrumbSeparator><BreadcrumbCurrent aria-current="location">Breadcrumb</BreadcrumbCurrent></BreadcrumbItem>
        </BreadcrumbList></Breadcrumb>
      </CatalogExample>
      <CatalogExample title="Chapter browsing" description="Numbers stay compact; accessible names include the full title. The current location remains actionable." code={`<Breadcrumb aria-label="Chapter browsing path">
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbButton onClick={browseChapter} aria-label="1 Research methods">1</BreadcrumbButton></BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbSeparator>/</BreadcrumbSeparator>
      <BreadcrumbButton onClick={browseSection} aria-label="1.2 Sampling" aria-current="location">1.2</BreadcrumbButton>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`}>
        <BreadcrumbBrowser ancestorsOnly={false} />
      </CatalogExample>
      <CatalogExample title="Section ancestry" description="Only ancestors appear in this path. The focused section has its own heading below; navigation restores focus there." code={`<Breadcrumb aria-label="Section ancestry">
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbButton onClick={inspectParent}>1 Research methods</BreadcrumbButton></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
<Text as="h4" variant="ui">1.2 Sampling</Text>`}>
        <BreadcrumbBrowser ancestorsOnly={true} />
      </CatalogExample>
      <CatalogExample title="Long paths" description="Items wrap together with their separator. Long labels remain readable without clipping or an overflow menu." code={`<BreadcrumbItem>
  <BreadcrumbSeparator>/</BreadcrumbSeparator>
  <BreadcrumbLink href="/#breadcrumb-research-source">Interdisciplinary research methodology and experimental design</BreadcrumbLink>
</BreadcrumbItem>`}>
        <div className="max-w-sm">
          <Breadcrumb aria-label="Research path"><BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/#purpose">Manual</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbItem><BreadcrumbSeparator>/</BreadcrumbSeparator><BreadcrumbLink href="/#breadcrumb-research-source">Interdisciplinary research methodology and experimental design</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbItem><BreadcrumbSeparator>/</BreadcrumbSeparator><BreadcrumbCurrent aria-current="location">measurementvalidationandreplicationprotocol</BreadcrumbCurrent></BreadcrumbItem>
          </BreadcrumbList></Breadcrumb>
          <div id="breadcrumb-research-source" className="mt-4 scroll-mt-4 border-t border-border pt-4">
            <Text as="h4" variant="ui">Interdisciplinary research methodology and experimental design</Text>
            <Text as="p" variant="caption" className="mt-2">Example source for the path above.</Text>
          </div>
        </div>
      </CatalogExample>
    </div>
  </Section>;
}

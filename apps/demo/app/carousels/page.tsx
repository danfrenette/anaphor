import { CarouselTabs } from "./carousel-tabs";

export default async function Carousels({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <CarouselTabs initialTab={tab === "deck" ? "deck" : "rail"} />;
}

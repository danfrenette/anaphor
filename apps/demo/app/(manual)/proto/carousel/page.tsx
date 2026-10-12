import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  redirect(`/carousels?tab=${v === "2" ? "deck" : "rail"}`);
}

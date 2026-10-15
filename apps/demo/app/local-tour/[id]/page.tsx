import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { localPreviewAllowed } from "@/features/tours/local-access";
import { readLocalTour } from "@/features/tours/local-store";
import { LocalTour } from "@/features/tours/local-tour";

export default async function LocalTourPage({ params }: { params: Promise<{ id: string }> }) {
  if (!localPreviewAllowed(await headers())) notFound();
  const { id } = await params;
  const tour = await readLocalTour(id).catch(() => null);
  if (!tour) notFound();
  return <LocalTour initial={tour} />;
}

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PrivateAccessError, requireTourOwner } from "@/features/tours/auth";
import { readTour } from "@/features/tours/publication";
import { PrivateTour, SignIn } from "@/features/tours/browser";

export default async function TourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let access;
  try { access = await requireTourOwner(await headers()); } catch (error) {
    if (error instanceof PrivateAccessError) return error.status === 401
      ? <SignIn returnTo={`/tour/${encodeURIComponent(id)}`} />
      : <p role="alert">This identity is not authorized to read private tours.</p>;
    throw error;
  }
  const initial = await readTour(id, access.owner);
  if (!initial) notFound();
  return <PrivateTour initial={initial} expiresAt={access.expiresAt} />;
}

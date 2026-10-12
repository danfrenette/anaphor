import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { accessFor, currentPrincipal, isTourId, testIdentityEnabled } from "../../../lib/tours/auth";
import { readTour } from "../../../lib/tours/store";
import { SignInActions, TourGate } from "../tour-gate";
import { TourReader } from "../tour-reader";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const access = accessFor(await currentPrincipal());
  const robots = { index: false, follow: false };
  if (access !== "allowed") return { title: "Private tour", robots };
  const { id } = await params;
  if (!isTourId(id)) return { title: "Private tour", robots };
  try {
    const tour = await readTour(id.toLowerCase());
    return { title: tour ? `${tour.title} · Anaphor` : "Private tour", robots };
  } catch {
    return { title: "Private tour", robots };
  }
}

export default async function TourPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const access = accessFor(await currentPrincipal());
  if (access === "unauthenticated") {
    const signInFailed = query["sign-in"] === "failed";
    return (
      <TourGate
        title="Sign in to read this tour"
        message={signInFailed ? "GitHub sign-in did not complete. Try again with the account that is allowed to read this tour." : "This tour is private. Sign in with the account that is allowed to read it."}
      >
        <SignInActions tourId={id} testIdentity={testIdentityEnabled()} />
      </TourGate>
    );
  }
  if (access === "forbidden") {
    return <TourGate title="You cannot read this tour" message="This account is signed in, but it is not allowed to read private tours." />;
  }
  if (!isTourId(id)) notFound();
  let stored: Awaited<ReturnType<typeof readTour>> | undefined;
  try {
    stored = await readTour(id.toLowerCase());
  } catch (error) {
    console.error("tour page failed", error instanceof Error ? error.name : "unknown");
  }
  if (stored === undefined) return <TourGate title="Tour storage is unavailable" message="The tour could not be loaded. Try again later." />;
  if (!stored) notFound();
  return <TourReader tour={stored} />;
}

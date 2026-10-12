import { Text, WorkspaceCardBody } from "@anaphor/system";
import type { ReactNode } from "react";
import { isTourId, ownerLogin } from "../../lib/tours/auth";
import { TourShell } from "./tour-shell";

const signInLinkClass = "inline-flex min-h-11 items-center text-ui underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring";

export function TourGate({ title, message, children }: { title: string; message: string; children?: ReactNode }) {
  return (
    <TourShell>
      <WorkspaceCardBody>
        <main id="content" tabIndex={-1} className="mx-auto w-full max-w-reading px-page-inset py-16 outline-none">
          <Text as="h1" variant="title">{title}</Text>
          <Text as="p" variant="body" className="mt-4">{message}</Text>
          {children}
        </main>
      </WorkspaceCardBody>
    </TourShell>
  );
}

export function SignInActions({ tourId, testIdentity }: { tourId: string; testIdentity: boolean }) {
  const returnTo = isTourId(tourId) ? `/tour/${tourId.toLowerCase()}` : "/";
  const query = `returnTo=${encodeURIComponent(returnTo)}`;
  if (testIdentity) {
    return (
      <ul className="mt-8 flex flex-col items-start gap-3">
        <li><a className={signInLinkClass} href={`/api/auth/test-session?login=${encodeURIComponent(ownerLogin())}&${query}`}>Sign in as Dan</a></li>
        <li><a className={signInLinkClass} href={`/api/auth/test-session?login=other&${query}`}>Sign in as another account</a></li>
      </ul>
    );
  }
  return <a className={`mt-8 ${signInLinkClass}`} href={`/api/auth/github?${query}`}>Sign in with GitHub</a>;
}

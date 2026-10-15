"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, ButtonLabel, ThemeToggle } from "@anaphor/system";
import { z } from "zod";
import { storedTour } from "./document";
import { TourReader } from "./reader";
import { accessDenied, http } from "./browser-http";
import { usePrivateAccess } from "./private-access";
import { usePrivateLogout } from "./use-private-logout";
import { SignIn } from "./sign-in";

export function PrivateTour({
  initial,
  expiresAt,
}: {
  initial: z.infer<typeof storedTour>;
  expiresAt: string;
}) {
  const access = usePrivateAccess(expiresAt);
  const logout = usePrivateLogout();
  if (access.ended)
    return (
      <div className="space-y-6">
        {logout.failed && (
          <>
            <p role="alert">
              Private content was cleared here, but server revocation could not
              be confirmed. Retry sign-out after connectivity returns.
            </p>
            <Button
              iconOnly={false}
              nativeButton={true}
              type="button"
              shape="square"
              size="md"
              variant="outline"
              tone="neutral"
              loading={logout.pending}
              onClick={logout.signOut}
            >
              <ButtonLabel>Retry sign out</ButtonLabel>
            </Button>
          </>
        )}
        <SignIn returnTo={`/tour/${initial.id}`} />
      </div>
    );
  return (
    <AuthorizedTour
      initial={initial}
      onLogout={logout.signOut}
      loggingOut={logout.pending}
    />
  );
}

function AuthorizedTour({
  initial,
  onLogout,
  loggingOut,
}: {
  initial: z.infer<typeof storedTour>;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const tour = useQuery({
    queryKey: ["private-tour", initial.id],
    queryFn: async () =>
      storedTour.parse((await http.get(`/api/tours/${initial.id}`)).data),
    initialData: initial,
    refetchOnMount: false,
  });
  if (accessDenied(tour.error)) return null;
  return (
    <>
      <div className="mb-12 flex flex-wrap items-center gap-3">
        <Button
          iconOnly={false}
          nativeButton={true}
          type="button"
          shape="square"
          size="md"
          variant="outline"
          tone="neutral"
          onClick={() => void tour.refetch()}
          loading={tour.isFetching}
        >
          <ButtonLabel>Refresh tour</ButtonLabel>
        </Button>
        <Button
          iconOnly={false}
          nativeButton={true}
          type="button"
          shape="square"
          size="md"
          variant="outline"
          tone="neutral"
          onClick={onLogout}
          loading={loggingOut}
        >
          <ButtonLabel>Sign out</ButtonLabel>
        </Button>
        <ThemeToggle />
      </div>
      {tour.isError && (
        <p role="alert" className="mb-6">
          The tour could not refresh. Your current revision is still shown. Try
          again.
        </p>
      )}
      <TourReader key={tour.dataUpdatedAt} document={tour.data.document} revision={tour.data.revision}
        assetBaseUrl={`/api/tours/${tour.data.id}/revisions/${tour.data.revision}/assets`} />
    </>
  );
}

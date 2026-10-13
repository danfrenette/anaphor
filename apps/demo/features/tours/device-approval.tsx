"use client";

import { Button, ButtonLabel, Input, Text } from "@anaphor/system";
import { usePrivateAccess } from "./private-access";
import { useDeviceReview } from "./use-device-review";
import { SignIn } from "./sign-in";

export function PrivateDevice({
  code,
  expiresAt,
}: {
  code: string;
  expiresAt: string;
}) {
  const access = usePrivateAccess(expiresAt);
  if (access.ended)
    return (
      <SignIn returnTo={`/tour/device?user_code=${encodeURIComponent(code)}`} />
    );
  return <DeviceApproval code={code} />;
}

export function DeviceApproval({ code }: { code: string }) {
  const review = useDeviceReview(code);
  return (
    <div className="space-y-6">
      <Text as="h1" variant="title">
        Approve a device
      </Text>
      <Text as="p" variant="body">
        Only approve a code displayed by the Anaphor CLI you started. Approval
        grants private tour reading and publication for 24 hours.
      </Text>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          review.reviewRequest();
        }}
      >
        <label className="grid gap-2">
          Device code
          <Input
            size="md"
            value={review.code}
            disabled={review.deciding}
            onChange={(event) => review.editCode(event.target.value)}
            required
            autoComplete="off"
          />
        </label>
        <Button
          iconOnly={false}
          nativeButton={true}
          type="submit"
          shape="square"
          size="md"
          variant="outline"
          tone="neutral"
          loading={review.reviewing}
        >
          <ButtonLabel>Review request</ButtonLabel>
        </Button>
      </form>
      {review.request && (
        <div className="space-y-4">
          <Text as="p" variant="body">
            Client: {review.request.client_id}
            <br />
            Permissions: {review.request.scope}
          </Text>
          <div className="flex gap-3">
            <Button
              iconOnly={false}
              nativeButton={true}
              type="button"
              shape="square"
              size="md"
              variant="outline"
              tone="neutral"
              onClick={() => review.decide("approve")}
              disabled={
                review.request.status !== "pending" || !!review.decision
              }
              loading={review.deciding}
            >
              <ButtonLabel>Approve device</ButtonLabel>
            </Button>
            <Button
              iconOnly={false}
              nativeButton={true}
              type="button"
              shape="square"
              size="md"
              variant="outline"
              tone="danger"
              onClick={() => review.decide("deny")}
              disabled={
                review.request.status !== "pending" || !!review.decision
              }
              loading={review.deciding}
            >
              <ButtonLabel>Deny device</ButtonLabel>
            </Button>
          </div>
        </div>
      )}
      {review.failed && (
        <p role="alert">
          The device request could not be processed. Check the code and sign-in,
          then try again.
        </p>
      )}
      {review.decision && <p role="status">{review.decision}</p>}
    </div>
  );
}

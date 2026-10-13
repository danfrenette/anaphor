"use client";

import { useMutation } from "@tanstack/react-query";
import { Button, ButtonLabel, Text } from "@anaphor/system";
import { z } from "zod";
import { http } from "./browser-http";

export function SignIn({ returnTo }: { returnTo: string }) {
  const signIn = useMutation({
    mutationFn: async (provider: "google" | "github") => {
      const response = await http.post("/api/auth/sign-in/social", {
        provider,
        callbackURL: `${location.origin}${returnTo}`,
      });
      const redirect = z.object({ url: z.url() }).parse(response.data);
      location.assign(redirect.url);
    },
  });
  return (
    <div className="space-y-6">
      <Text as="h1" variant="title">
        Sign in to Anaphor
      </Text>
      <Text as="p" variant="body">
        Private tours are available to the owner. Sign in with your approved
        identity. Sessions end after 24 hours.
      </Text>
      <div className="flex flex-wrap gap-3">
        {(["google", "github"] satisfies Array<"google" | "github">).map(
          (provider) => (
            <Button
              iconOnly={false}
              nativeButton={true}
              type="button"
              shape="square"
              size="md"
              variant="outline"
              tone="neutral"
              key={provider}
              onClick={() => signIn.mutate(provider)}
              loading={signIn.isPending}
            >
              <ButtonLabel>
                Continue with {provider === "google" ? "Google" : "GitHub"}
              </ButtonLabel>
            </Button>
          ),
        )}
      </div>
      {signIn.isError && (
        <p role="alert">
          Sign-in could not start. Check the provider setup and try again.
        </p>
      )}
    </div>
  );
}

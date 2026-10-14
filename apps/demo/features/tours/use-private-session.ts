"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { http } from "./browser-http";

const session = z.object({
  owner: z.literal("dan"),
  expiresAt: z.iso.datetime(),
});

export function usePrivateSession(expiresAt: string, enabled: boolean) {
  return useQuery<z.infer<typeof session>>({
    queryKey: ["private-session"],
    enabled: (query) =>
      enabled &&
      Date.now() < Math.min(
        Date.parse(expiresAt),
        Date.parse(query.state.data?.expiresAt ?? expiresAt),
      ),
    queryFn: async ({ signal }) =>
      session.parse((await http.get("/api/tours/session", { signal })).data),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

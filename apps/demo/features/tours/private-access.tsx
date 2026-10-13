"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { z } from "zod";
import { accessDenied, http, retryPrivateQuery } from "./browser-http";

const session = z.object({
  owner: z.literal("dan"),
  expiresAt: z.iso.datetime(),
});
const PrivateAccess = createContext<{ ended: boolean; end: () => void } | null>(
  null,
);

export function PrivateQueries({ children }: { children: ReactNode }) {
  const [ended, setEnded] = useState(false);
  const end = useCallback(() => setEnded(true), []);
  const [client] = useState(() => {
    const onError = (error: unknown) => {
      if (accessDenied(error)) end();
    };
    return new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: {
          retry: retryPrivateQuery,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          staleTime: Infinity,
        },
        mutations: { retry: false },
      },
    });
  });

  useEffect(() => {
    if (ended) client.clear();
  }, [client, ended]);

  return (
    <QueryClientProvider client={client}>
      <PrivateAccess value={{ ended, end }}>{children}</PrivateAccess>
    </QueryClientProvider>
  );
}

export function usePrivateAccessState() {
  const access = useContext(PrivateAccess);
  if (!access) throw new Error("Private access requires PrivateQueries.");
  return access;
}

export function usePrivateAccess(expiresAt: string) {
  const access = usePrivateAccessState();
  const sessionQuery = useQuery({
    queryKey: ["private-session"],
    enabled: !access.ended,
    queryFn: async () =>
      session.parse((await http.get("/api/tours/session")).data),
    staleTime: 0,
  });
  const expiry = Math.min(
    new Date(expiresAt).getTime(),
    new Date(sessionQuery.data?.expiresAt ?? expiresAt).getTime(),
  );
  const { ended, end } = access;
  const { refetch } = sessionQuery;

  useEffect(() => {
    if (ended) return;
    if (expiry <= Date.now()) {
      end();
      return;
    }
    const timer = setTimeout(end, expiry - Date.now());
    const recheck = () => {
      if (Date.now() >= expiry) end();
      else void refetch();
    };
    window.addEventListener("focus", recheck);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", recheck);
    };
  }, [end, ended, expiry, refetch]);

  return access;
}

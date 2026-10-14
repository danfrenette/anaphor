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
} from "@tanstack/react-query";
import { accessDenied, retryPrivateQuery } from "./browser-http";
import { usePrivateSession } from "./use-private-session";
import { useSessionExpiry } from "./use-session-expiry";

const PrivateAccess = createContext<{
  ended: boolean;
  end: () => void;
} | null>(null);

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

  // Clear after the access gate has unmounted private query consumers.
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
  const session = usePrivateSession(expiresAt, !access.ended);
  const expiry = Math.min(
    Date.parse(expiresAt),
    Date.parse(session.data?.expiresAt ?? expiresAt),
  );
  const expired = useSessionExpiry(expiry, access.end, !access.ended);
  return { ended: access.ended || expired, end: access.end };
}

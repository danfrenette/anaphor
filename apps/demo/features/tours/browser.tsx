"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ButtonLabel, Input, ThemeToggle, Text } from "@anaphor/system";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { storedTour } from "./document";
import { TourReader } from "./reader";

const http = axios.create({ baseURL: "/", timeout: 15_000 });
const session = z.object({ owner: z.literal("dan"), expiresAt: z.iso.datetime() });
const retry = (attempts: number, error: Error) => attempts < 1 && axios.isAxiosError(error) && (!error.response || error.response.status >= 500);

const AccessEnded = createContext<{ ended: boolean; end: (ended: boolean) => void }>({ ended: false, end: () => {} });
const accessDenied = (error: unknown) => axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);

export function PrivateQueries({ children }: { children: ReactNode }) {
  const [ended, setEnded] = useState(false);
  const [client] = useState(() => {
    const onError = (error: unknown) => {
      if (accessDenied(error)) setEnded(true);
    };
    return new QueryClient({ queryCache: new QueryCache({ onError }), mutationCache: new MutationCache({ onError }), defaultOptions: { queries: { retry, refetchOnWindowFocus: false, refetchOnReconnect: false, staleTime: Infinity }, mutations: { retry: false } } });
  });
  useEffect(() => { if (ended) client.clear(); }, [client, ended]);
  return <QueryClientProvider client={client}><AccessEnded value={{ ended, end: setEnded }}>{children}</AccessEnded></QueryClientProvider>;
}

function usePrivateExpiry(expiresAt: string) {
  const client = useQueryClient();
  const { ended, end } = useContext(AccessEnded);
  const [expired, setExpired] = useState(false);
  const access = useQuery({ queryKey: ["private-session"], enabled: !ended && !expired, queryFn: async () => session.parse((await http.get("/api/tours/session")).data), staleTime: 0 });
  const { refetch } = access;
  const expiry = Math.min(new Date(expiresAt).getTime(), new Date(access.data?.expiresAt ?? expiresAt).getTime());
  useEffect(() => {
    if (ended || expired) return;
    const clear = () => { setExpired(true); end(true); queueMicrotask(() => client.clear()); };
    if (expiry <= Date.now()) { clear(); return; }
    const timer = setTimeout(clear, expiry - Date.now());
    const recheck = () => { if (Date.now() >= expiry) clear(); else void refetch(); };
    window.addEventListener("focus", recheck);
    return () => { clearTimeout(timer); window.removeEventListener("focus", recheck); };
  }, [client, end, ended, expired, expiry, refetch]);
  return { expired: ended || expired, clear: () => { setExpired(true); end(true); queueMicrotask(() => client.clear()); } };
}

export function SignIn({ returnTo }: { returnTo: string }) {
  const signIn = useMutation({ mutationFn: async (provider: "google" | "github") => {
    const response = await http.post("/api/auth/sign-in/social", { provider, callbackURL: `${location.origin}${returnTo}` });
    const redirect = z.object({ url: z.url() }).parse(response.data);
    location.assign(redirect.url);
  } });
  return <div className="space-y-6">
    <Text as="h1" variant="title">Sign in to Anaphor</Text>
    <Text as="p" variant="body">Private tours are available to the owner. Sign in with your approved identity. Sessions end after 24 hours.</Text>
    <div className="flex flex-wrap gap-3">
      {(["google", "github"] satisfies Array<"google" | "github">).map((provider) => <Button iconOnly={false} nativeButton={true} type="button" shape="square" size="md" variant="outline" tone="neutral" key={provider} onClick={() => signIn.mutate(provider)} loading={signIn.isPending}>
        <ButtonLabel>Continue with {provider === "google" ? "Google" : "GitHub"}</ButtonLabel>
      </Button>)}
    </div>
    {signIn.isError && <p role="alert">Sign-in could not start. Check the provider setup and try again.</p>}
  </div>;
}

export function PrivateTour({ initial, expiresAt }: { initial: z.infer<typeof storedTour>; expiresAt: string }) {
  const access = usePrivateExpiry(expiresAt);
  const router = useRouter();
  const [logoutFailed, setLogoutFailed] = useState(false);
  const logout = useMutation({ mutationFn: async () => {
    try { await http.post("/api/tours/logout", {}); setLogoutFailed(false); router.refresh(); } catch { setLogoutFailed(true); }
    finally { access.clear(); }
  } });
  if (access.expired) return <div className="space-y-6">
    {logoutFailed && <><p role="alert">Private content was cleared here, but server revocation could not be confirmed. Retry sign-out after connectivity returns.</p>
      <Button iconOnly={false} nativeButton={true} type="button" shape="square" size="md" variant="outline" tone="neutral" loading={logout.isPending} onClick={() => logout.mutate()}><ButtonLabel>Retry sign out</ButtonLabel></Button></>}
    <SignIn returnTo={`/tour/${initial.id}`} />
  </div>;
  return <AuthorizedTour initial={initial} onLogout={() => logout.mutate()} loggingOut={logout.isPending} />;
}

function AuthorizedTour({ initial, onLogout, loggingOut }: { initial: z.infer<typeof storedTour>; onLogout: () => void; loggingOut: boolean }) {
  const tour = useQuery({ queryKey: ["private-tour", initial.id], queryFn: async () => storedTour.parse((await http.get(`/api/tours/${initial.id}`)).data), initialData: initial, refetchOnMount: false });
  if (accessDenied(tour.error)) return null;
  return <>
    <div className="mb-12 flex flex-wrap items-center gap-3">
      <Button iconOnly={false} nativeButton={true} type="button" shape="square" size="md" variant="outline" tone="neutral" onClick={() => void tour.refetch()} loading={tour.isFetching}><ButtonLabel>Refresh tour</ButtonLabel></Button>
      <Button iconOnly={false} nativeButton={true} type="button" shape="square" size="md" variant="outline" tone="neutral" onClick={onLogout} loading={loggingOut}><ButtonLabel>Sign out</ButtonLabel></Button>
      <ThemeToggle />
    </div>
    {tour.isError && <p role="alert" className="mb-6">The tour could not refresh. Your current revision is still shown. Try again.</p>}
    <TourReader document={tour.data.document} revision={tour.data.revision} />
  </>;
}

export function PrivateDevice({ code, expiresAt }: { code: string; expiresAt: string }) {
  const access = usePrivateExpiry(expiresAt);
  if (access.expired) return <SignIn returnTo={`/tour/device?user_code=${encodeURIComponent(code)}`} />;
  return <DeviceApproval code={code} />;
}

export function DeviceApproval({ code }: { code: string }) {
  const [userCode, setUserCode] = useState(code);
  const [decision, setDecision] = useState("");
  const review = useQuery({ queryKey: ["device-review", userCode], enabled: false, queryFn: async () => {
    const response = await http.get("/api/auth/device", { params: { user_code: userCode } });
    return z.object({ client_id: z.string(), scope: z.string(), status: z.string() }).parse(response.data);
  } });
  const decide = useMutation({ mutationFn: async (action: "approve" | "deny") => {
    await http.post(`/api/auth/device/${action}`, { userCode });
    setDecision(action === "approve" ? "Device approved. Return to your CLI." : "Device denied.");
  } });
  return <div className="space-y-6">
    <Text as="h1" variant="title">Approve a device</Text>
    <Text as="p" variant="body">Only approve a code displayed by the Anaphor CLI you started. Approval grants private tour reading and publication for 24 hours.</Text>
    <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void review.refetch(); }}>
      <label className="grid gap-2">Device code<Input size="md" value={userCode} disabled={decide.isPending} onChange={(event) => { setUserCode(event.target.value); setDecision(""); }} required autoComplete="off" /></label>
      <Button iconOnly={false} nativeButton={true} type="submit" shape="square" size="md" variant="outline" tone="neutral" loading={review.isFetching}><ButtonLabel>Review request</ButtonLabel></Button>
    </form>
    {review.data && <div className="space-y-4">
      <Text as="p" variant="body">Client: {review.data.client_id}<br />Permissions: {review.data.scope}</Text>
      <div className="flex gap-3"><Button iconOnly={false} nativeButton={true} type="button" shape="square" size="md" variant="outline" tone="neutral" onClick={() => decide.mutate("approve")} disabled={review.data.status !== "pending" || !!decision} loading={decide.isPending}><ButtonLabel>Approve device</ButtonLabel></Button>
        <Button iconOnly={false} nativeButton={true} type="button" shape="square" size="md" variant="outline" tone="danger" onClick={() => decide.mutate("deny")} disabled={review.data.status !== "pending" || !!decision} loading={decide.isPending}><ButtonLabel>Deny device</ButtonLabel></Button></div>
    </div>}
    {(review.isError || decide.isError) && <p role="alert">The device request could not be processed. Check the code and sign-in, then try again.</p>}
    {decision && <p role="status">{decision}</p>}
  </div>;
}

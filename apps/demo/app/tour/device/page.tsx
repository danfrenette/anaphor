import { headers } from "next/headers";
import { PrivateAccessError, requireTourOwner } from "@/features/tours/auth";
import { PrivateDevice, SignIn } from "@/features/tours/browser";

export default async function DevicePage({ searchParams }: { searchParams: Promise<{ user_code?: string }> }) {
  const { user_code = "" } = await searchParams;
  let access;
  try { access = await requireTourOwner(await headers()); } catch (error) {
    if (error instanceof PrivateAccessError) return error.status === 401
      ? <SignIn returnTo={`/tour/device?user_code=${encodeURIComponent(user_code)}`} />
      : <p role="alert">This identity is not authorized to approve devices.</p>;
    throw error;
  }
  return <PrivateDevice code={user_code} expiresAt={access.expiresAt} />;
}

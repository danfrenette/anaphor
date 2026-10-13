"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { http } from "./browser-http";
import { usePrivateAccessState } from "./private-access";

export function usePrivateLogout() {
  const { end } = usePrivateAccessState();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const mutation = useMutation({
    mutationFn: async () => {
      try {
        await http.post("/api/tours/logout", {});
        setFailed(false);
        router.refresh();
      } catch {
        setFailed(true);
      } finally {
        end();
      }
    },
  });

  return {
    failed,
    pending: mutation.isPending,
    signOut: () => mutation.mutate(),
  };
}

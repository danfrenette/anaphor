"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { http } from "./browser-http";

const deviceRequest = z.object({
  client_id: z.string(),
  scope: z.string(),
  status: z.string(),
});

export function useDeviceReview(initialCode: string) {
  const [code, setCode] = useState(initialCode);
  const [decision, setDecision] = useState("");
  const review = useQuery({
    queryKey: ["device-review", code],
    enabled: false,
    queryFn: async () => {
      const response = await http.get("/api/auth/device", {
        params: { user_code: code },
      });
      return deviceRequest.parse(response.data);
    },
  });
  const mutation = useMutation({
    mutationFn: async (action: "approve" | "deny") => {
      await http.post(`/api/auth/device/${action}`, { userCode: code });
      setDecision(
        action === "approve"
          ? "Device approved. Return to your CLI."
          : "Device denied.",
      );
    },
  });

  function editCode(value: string) {
    setCode(value);
    setDecision("");
  }

  return {
    code,
    editCode,
    request: review.data,
    reviewing: review.isFetching,
    reviewRequest: () => {
      void review.refetch();
    },
    decision,
    deciding: mutation.isPending,
    decide: (action: "approve" | "deny") => mutation.mutate(action),
    failed: review.isError || mutation.isError,
  };
}

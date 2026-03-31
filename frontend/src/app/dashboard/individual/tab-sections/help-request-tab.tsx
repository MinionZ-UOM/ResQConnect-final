"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import HelpRequestForm from "../components/help-request-form";
import type { RequestCreatePayload } from "@/lib/types/request";
import { createRequest, MY_REQUESTS_QUERY_KEY } from "@/services/requestService";

export default function HelpRequestTab() {
  const queryClient = useQueryClient();

  const createRequestMutation = useMutation({
    mutationFn: (payload: RequestCreatePayload) => createRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_REQUESTS_QUERY_KEY });
    },
  });

  const handleSubmit = async (payload: RequestCreatePayload) => {
    await createRequestMutation.mutateAsync(payload);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Help Request</CardTitle>
          <CardDescription>
            Provide clear details so responders can assist quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HelpRequestForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}

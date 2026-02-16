"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import HelpRequestForm from "../components/help-request-form";
import type { RequestCreatePayload } from "@/lib/types/request";
import { createRequest } from "@/services/requestService";

export default function HelpRequestTab() {
  const handleSubmit = async (payload: RequestCreatePayload) => {
    await createRequest(payload);
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

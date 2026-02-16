"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FieldReportForm from "../components/field-report-form";
import type { FieldReportCreate } from "@/lib/types";

type Props = {
  onSubmitReport: (data: FieldReportCreate) => void;
};

export default function FieldReportTab({ onSubmitReport }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Field Report</CardTitle>
          <CardDescription>
            Report on-site conditions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldReportForm onSubmit={onSubmitReport} />
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { POLICY_COMPARISON } from "../../data/simulation-data";
import { BarChart3 } from "lucide-react";

const chartConfig = {
    priority_weighted_response_time: { label: "Avg. Response Time (min)", color: "hsl(220, 80%, 60%)" },
};

const FEASIBILITY_COLORS: Record<string, string> = {
    LOW: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    HIGH: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
};

const POLICY_LABELS: Record<string, string> = {
    "Greedy": "First Come, First Served",
    "Periodic-60": "Re-plan Every 60 min",
    "Periodic-30": "Re-plan Every 30 min",
    "AET": "Smart Re-plan (AET)",
    "Continuous": "Continuous Re-plan",
};

export function SimPolicyChart() {
    const data = POLICY_COMPARISON.map((p) => ({
        ...p,
        label: POLICY_LABELS[p.policy] ?? p.policy,
    }));

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-xl">Routing Strategy Comparison</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                    How different planning approaches compare on average response time. Lower is better.
                </p>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 12 }} label={{ value: "minutes", angle: -90, position: "insideLeft", style: { fontSize: 12 } }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="priority_weighted_response_time" name="Response Time" fill="var(--color-priority_weighted_response_time)" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                </ChartContainer>
                <div className="flex flex-wrap items-center gap-3 mt-4 justify-center">
                    {POLICY_COMPARISON.map((p) => (
                        <div key={p.policy} className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">{POLICY_LABELS[p.policy] ?? p.policy}:</span>
                            <Badge className={`pointer-events-none text-xs ${FEASIBILITY_COLORS[p.feasibility] ?? ""}`}>
                                {p.feasibility === "HIGH" ? "Recommended" : p.feasibility === "MEDIUM" ? "Acceptable" : "Not Ideal"}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

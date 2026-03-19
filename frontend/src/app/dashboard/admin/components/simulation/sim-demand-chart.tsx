"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { computeAggregateDemand } from "../../data/simulation-data";
import { Package } from "lucide-react";

const data = computeAggregateDemand();

const chartConfig = {
    total: { label: "Total Demand", color: "hsl(270, 70%, 55%)" },
};

export function SimDemandChart() {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-xl">Total Resource Demand</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                    Combined demand across all incident requests by supply type.
                </p>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={130} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="total" name="Total Demand" fill="var(--color-total)" radius={[0, 6, 6, 0]} barSize={24} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

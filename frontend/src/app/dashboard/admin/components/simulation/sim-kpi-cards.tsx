"use client";

import { Card } from "@/components/ui/card";
import {
    AlertTriangle, Truck, Users, Clock, CheckCircle2, XCircle
} from "lucide-react";
import { KPIS } from "../../data/simulation-data";

const cards = [
    { label: "Active Requests", value: KPIS.active_requests, icon: AlertTriangle, accent: "border-red-200 dark:border-red-800", color: "text-red-600 dark:text-red-400" },
    { label: "People Affected", value: KPIS.total_people_affected, icon: Users, accent: "border-violet-200 dark:border-violet-800", color: "text-violet-600 dark:text-violet-400" },
    { label: "Vehicles Ready", value: KPIS.available_vehicles, icon: Truck, accent: "border-green-200 dark:border-green-800", color: "text-green-600 dark:text-green-400" },
    { label: "Avg. ETA", value: `${KPIS.average_eta_min} min`, icon: Clock, accent: "border-cyan-200 dark:border-cyan-800", color: "text-cyan-600 dark:text-cyan-400" },
    { label: "Fulfilled", value: KPIS.fulfilled_requests, icon: CheckCircle2, accent: "border-green-200 dark:border-green-800", color: "text-green-600 dark:text-green-400" },
    { label: "Unserved", value: KPIS.unserved_requests, icon: XCircle, accent: "border-red-200 dark:border-red-800", color: "text-red-600 dark:text-red-400" },
];

export function SimKpiCards() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {cards.map((c) => {
                const Icon = c.icon;
                return (
                    <Card key={c.label} className={`p-4 flex flex-col gap-2 border-2 ${c.accent} bg-muted/10`}>
                        <div className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${c.color}`} />
                            <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
                        </div>
                        <div className="text-3xl font-bold tracking-tight">{c.value}</div>
                    </Card>
                );
            })}
        </div>
    );
}

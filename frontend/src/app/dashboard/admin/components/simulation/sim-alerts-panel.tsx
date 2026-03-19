"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LOAD_SNAPSHOT, REQUESTS } from "../../data/simulation-data";
import { AlertTriangle, Cloud, Construction } from "lucide-react";

type AlertItem = {
    icon: React.ElementType;
    severity: "critical" | "warning";
    title: string;
};

function buildAlerts(): AlertItem[] {
    const alerts: AlertItem[] = [];

    if (LOAD_SNAPSHOT.weather_severity === "SEVERE_RAIN") {
        alerts.push({ icon: Cloud, severity: "critical", title: "Severe rain across all districts" });
    }
    if (LOAD_SNAPSHOT.bridge_closure_count > 0) {
        alerts.push({ icon: Construction, severity: "critical", title: `${LOAD_SNAPSHOT.bridge_closure_count} bridge closures` });
    }
    if (LOAD_SNAPSHOT.partial_road_block_count > 0) {
        alerts.push({ icon: Construction, severity: "warning", title: `${LOAD_SNAPSHOT.partial_road_block_count} partial road blocks` });
    }
    const overflow = REQUESTS.filter((r) => r.special_notes.toLowerCase().includes("overflow"));
    if (overflow.length > 0) {
        alerts.push({ icon: AlertTriangle, severity: "warning", title: "Shelter overflow reported" });
    }
    const medical = REQUESTS.filter((r) => r.special_notes.toLowerCase().includes("injur"));
    if (medical.length > 0) {
        alerts.push({ icon: AlertTriangle, severity: "critical", title: "Injuries reported — medical priority" });
    }

    return alerts;
}

const severity_styles = {
    critical: "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 text-red-800 dark:text-red-300",
    warning: "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300",
};
const icon_color = { critical: "text-red-500", warning: "text-amber-500" };

export function SimAlertsPanel() {
    const alerts = buildAlerts();

    return (
        <div className="flex flex-wrap gap-2">
            {alerts.map((a, i) => {
                const Icon = a.icon;
                return (
                    <div key={i} className={`inline-flex items-center gap-2 border rounded-full px-4 py-2 text-sm font-medium ${severity_styles[a.severity]}`}>
                        <Icon className={`h-4 w-4 ${icon_color[a.severity]}`} />
                        {a.title}
                    </div>
                );
            })}
        </div>
    );
}

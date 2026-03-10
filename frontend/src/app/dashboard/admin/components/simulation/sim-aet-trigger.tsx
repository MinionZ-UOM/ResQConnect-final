"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AET_EVENTS, REQUESTS } from "../../data/simulation-data";
import { Zap, ArrowRight, RefreshCw, Plus } from "lucide-react";

export function SimAetTrigger() {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-xl">Re-optimization Events</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    When new situations arise, the system decides whether to update the delivery plan.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {AET_EVENTS.map((evt) => {
                    const reqName = REQUESTS.find((r) => r.request_id === evt.new_request_id)?.location_name ?? evt.new_request_id;
                    const isReopt = evt.decision === "TRIGGER_REOPTIMIZATION";
                    const Icon = isReopt ? RefreshCw : Plus;
                    return (
                        <div
                            key={evt.event_id}
                            className={`border-2 rounded-xl p-5 space-y-3 ${isReopt
                                    ? "border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20"
                                    : "border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20"
                                }`}
                        >
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <Icon className={`h-5 w-5 ${isReopt ? "text-red-500" : "text-emerald-500"}`} />
                                    <div>
                                        <span className="text-base font-semibold">{reqName}</span>
                                        <span className="text-sm text-muted-foreground ml-2">at {evt.time_min} min</span>
                                    </div>
                                </div>
                                <Badge className={`text-xs px-3 py-1 pointer-events-none ${isReopt
                                        ? "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300"
                                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                                    }`}>
                                    {isReopt ? "Full Re-plan" : "Local Adjustment"}
                                </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">{evt.reason}</p>

                            {/* Simplified urgency indicator */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">Urgency:</span>
                                <div className="flex-1 h-3 rounded-full bg-muted/50 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${evt.phi_urgency >= 0.7 ? "bg-red-500" : evt.phi_urgency >= 0.4 ? "bg-amber-500" : "bg-green-500"
                                            }`}
                                        style={{ width: `${evt.phi_urgency * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm font-semibold w-14 text-right">
                                    {evt.phi_urgency >= 0.7 ? "High" : evt.phi_urgency >= 0.4 ? "Medium" : "Low"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

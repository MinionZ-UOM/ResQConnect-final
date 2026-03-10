"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CURRENT_PLAN, REQUESTS, DEPOTS, VEHICLES, COMMODITIES, STATUS_COLORS } from "../../data/simulation-data";
import { Route, ArrowRight } from "lucide-react";

const requestNames: Record<string, string> = {};
for (const r of REQUESTS) requestNames[r.request_id] = r.location_name;
const depotNames: Record<string, string> = {};
for (const d of DEPOTS) depotNames[d.depot_id] = d.name;
const vehicleTypes: Record<string, string> = {
    "6T_LORRY": "6-Ton Lorry",
    "3T_TRUCK": "3-Ton Truck",
    "4X4_PICKUP": "4×4 Pickup",
    "VAN_MEDICAL": "Medical Van",
    "TRACTOR_TRAILER": "Tractor Trailer",
};

function label(id: string): string {
    return requestNames[id] ?? depotNames[id] ?? id;
}

export function SimDispatchRoutes() {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-xl">Active Delivery Routes</CardTitle>
                    <Badge variant="outline" className="ml-auto text-sm">{CURRENT_PLAN.length} routes</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {CURRENT_PLAN.map((plan) => {
                    const pct = Math.round(plan.load_utilization_after_dispatch * 100);
                    const vehicle = VEHICLES.find((v) => v.vehicle_id === plan.vehicle_id);
                    const typeLabel = vehicle ? (vehicleTypes[vehicle.type] ?? vehicle.type) : plan.vehicle_id;

                    return (
                        <div key={plan.vehicle_id} className="border-2 rounded-xl overflow-hidden">
                            {/* Route header */}
                            <div className="bg-muted/30 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-base font-bold">{plan.vehicle_id}</span>
                                    <span className="text-sm text-muted-foreground">{typeLabel}</span>
                                    <Badge className={`pointer-events-none text-xs ${STATUS_COLORS[plan.status] ?? ""}`}>
                                        Dispatched
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Load:</span>
                                    <Progress value={pct} className="h-2.5 w-28" />
                                    <span className="text-sm font-bold">{pct}%</span>
                                </div>
                            </div>

                            {/* Route sequence */}
                            <div className="px-5 py-3.5 flex flex-wrap items-center gap-2 border-b bg-muted/10">
                                {plan.route.map((stop, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-sm font-semibold ${stop.startsWith("D") ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"}`}>
                                                {label(stop)}
                                            </span>
                                            {stop.startsWith("R") && (
                                                <span className="text-xs text-muted-foreground">
                                                    (ETA: {plan.eta_sequence_min[i]} min)
                                                </span>
                                            )}
                                        </div>
                                        {i < plan.route.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                ))}
                            </div>

                            {/* Allocated resources per stop */}
                            {Object.entries(plan.allocated_resources).map(([stopId, alloc]) => (
                                <div key={stopId} className="px-5 py-3 border-b last:border-b-0">
                                    <div className="text-sm font-semibold mb-2 text-blue-600 dark:text-blue-400">
                                        📦 Delivery to {label(stopId)}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {COMMODITIES.filter((c) => (alloc[c.code] ?? 0) > 0).map((c) => (
                                            <div key={c.code} className="bg-muted/30 rounded-lg px-3 py-1.5 text-sm">
                                                <span className="text-muted-foreground">{c.name}:</span>{" "}
                                                <span className="font-semibold">{alloc[c.code]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

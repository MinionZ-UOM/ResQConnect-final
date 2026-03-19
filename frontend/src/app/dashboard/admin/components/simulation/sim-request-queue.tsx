"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUESTS, PRIORITY_COLORS, STATUS_COLORS } from "../../data/simulation-data";
import { ListChecks } from "lucide-react";

export function SimRequestQueue() {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-xl">Incident Requests</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {REQUESTS.map((r) => (
                        <div
                            key={r.request_id}
                            className="border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                        >
                            <div className="flex-1 min-w-[200px]">
                                <div className="font-semibold text-base">{r.location_name}</div>
                                <div className="text-sm text-muted-foreground mt-0.5">
                                    {r.district} · {r.hazard_type === "FLOOD" ? "🌊 Flood" : "⛰️ Landslide"} · {r.people_affected} people
                                </div>
                                {r.special_notes && (
                                    <div className="text-xs text-muted-foreground mt-1 italic">{r.special_notes}</div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className={`pointer-events-none text-xs px-3 py-1 ${PRIORITY_COLORS[r.priority] ?? ""}`}>
                                    {r.priority}
                                </Badge>
                                <Badge className={`pointer-events-none text-xs px-3 py-1 ${STATUS_COLORS[r.status] ?? ""}`}>
                                    {r.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

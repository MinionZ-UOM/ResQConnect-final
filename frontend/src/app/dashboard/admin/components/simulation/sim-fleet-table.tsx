"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { VEHICLES, VEHICLE_STATUS_COLORS } from "../../data/simulation-data";
import { Truck } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
    "6T_LORRY": "6-Ton Lorry",
    "3T_TRUCK": "3-Ton Truck",
    "4X4_PICKUP": "4×4 Pickup",
    "VAN_MEDICAL": "Medical Van",
    "TRACTOR_TRAILER": "Tractor Trailer",
};

export function SimFleetTable() {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-xl">Fleet Status</CardTitle>
                    <Badge variant="outline" className="ml-auto text-sm">{VEHICLES.length} vehicles</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="text-sm font-semibold">Vehicle</TableHead>
                                    <TableHead className="text-sm font-semibold">Type</TableHead>
                                    <TableHead className="text-sm font-semibold text-right">Capacity</TableHead>
                                    <TableHead className="text-sm font-semibold w-[180px]">Current Load</TableHead>
                                    <TableHead className="text-sm font-semibold text-center">Status</TableHead>
                                    <TableHead className="text-sm font-semibold">Driver / Team</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {VEHICLES.map((v) => {
                                    const pct = Math.round(v.current_load_utilization * 100);
                                    return (
                                        <TableRow key={v.vehicle_id} className="hover:bg-muted/20">
                                            <TableCell className="font-semibold text-sm">{v.vehicle_id}</TableCell>
                                            <TableCell className="text-sm">{TYPE_LABELS[v.type] ?? v.type}</TableCell>
                                            <TableCell className="text-right text-sm font-medium">
                                                {(v.capacity_kg / 1000).toFixed(0)} tons
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={pct} className="h-2.5 flex-1" />
                                                    <span className="text-sm font-semibold w-10 text-right">{pct}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`pointer-events-none text-xs px-2.5 py-0.5 ${VEHICLE_STATUS_COLORS[v.status] ?? ""}`}>
                                                    {v.status === "EN_ROUTE" ? "En Route" : v.status === "AVAILABLE" ? "Available" : v.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{v.driver}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

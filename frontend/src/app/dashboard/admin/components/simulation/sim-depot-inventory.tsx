"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DEPOTS, COMMODITIES } from "../../data/simulation-data";
import { Warehouse } from "lucide-react";

function maxStock(code: string): number {
    return Math.max(...DEPOTS.map((d) => d.inventory[code] ?? 0), 1);
}

export function SimDepotInventory() {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-xl">Depot Inventory</CardTitle>
                    <Badge variant="outline" className="ml-auto text-sm">{DEPOTS.length} depots</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {DEPOTS.map((depot) => (
                    <div key={depot.depot_id} className="border-2 rounded-xl overflow-hidden">
                        <div className="bg-muted/30 px-5 py-3">
                            <span className="font-bold text-base">{depot.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">— {depot.district} District</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                            {COMMODITIES.map((c) => {
                                const qty = depot.inventory[c.code] ?? 0;
                                const max = maxStock(c.code);
                                const pct = Math.round((qty / max) * 100);
                                return (
                                    <div key={c.code} className="bg-muted/10 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{c.name}</span>
                                            <span className="text-base font-bold">{qty.toLocaleString()}</span>
                                        </div>
                                        <Progress value={pct} className="h-2.5" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

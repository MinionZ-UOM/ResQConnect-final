import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, Table as TableIcon } from "lucide-react";

export function AdminSupplySnapshot({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
    const dummySupplies = [
        { location: "Central Medical Depot", item: "IV Fluids (1L)", qty: "12,500", vehicles: "4 Temp-controlled Trucks" },
        { location: "Central Medical Depot", item: "Surgical Masks", qty: "250,000", vehicles: "Included" },
        { location: "North Emergency Base", item: "Thermal Blankets", qty: "8,200", vehicles: "2 Heavy Duty Trucks" },
        { location: "North Emergency Base", item: "MREs (Meals Ready to Eat)", qty: "15,000", vehicles: "3 Transport Vans" },
        { location: "South Logistics Hub", item: "Portable Generators", qty: "45", vehicles: "1 Flatbed Truck" },
        { location: "South Logistics Hub", item: "Water Purification Tablets", qty: "100,000", vehicles: "Included" },
        { location: "East Coast Reserve", item: "Heavy Duty Tents", qty: "320", vehicles: "2 Transport Vans" },
        { location: "West Coast Reserve", item: "First Aid Kits (Trauma)", qty: "4,500", vehicles: "1 Transport Van" },
    ];

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={onOpenChange}
            className="border rounded-xl px-4 py-3 bg-muted/5 shadow-sm"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Supply Snapshot (Network Sync)</h3>
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-4 pb-2">
                <div className="text-sm text-muted-foreground mb-4">
                    Current Available Resources across regional depots. Data updated chronologically via field reports.
                </div>
                <div className="border rounded-md overflow-hidden bg-background">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Depot / Location</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Qty Available</TableHead>
                                <TableHead>Transport Allocation</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dummySupplies.map((supply, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{supply.location}</TableCell>
                                    <TableCell>{supply.item}</TableCell>
                                    <TableCell className="text-right font-medium">{supply.qty}</TableCell>
                                    <TableCell className="text-muted-foreground">{supply.vehicles}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

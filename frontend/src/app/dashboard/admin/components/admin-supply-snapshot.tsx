import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, Warehouse } from "lucide-react";

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
            className="border-2 rounded-xl px-5 py-4 bg-muted/5 shadow-sm"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Warehouse className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-base font-semibold">Supply Snapshot</h3>
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
                        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-4 pb-2">
                <p className="text-sm text-muted-foreground mb-4">
                    Current available resources across regional depots.
                </p>
                <div className="border rounded-lg overflow-hidden bg-background">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-sm font-semibold py-3">Depot / Location</TableHead>
                                <TableHead className="text-sm font-semibold py-3">Item</TableHead>
                                <TableHead className="text-sm font-semibold text-right py-3">Qty Available</TableHead>
                                <TableHead className="text-sm font-semibold py-3">Transport</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dummySupplies.map((supply, i) => (
                                <TableRow key={i} className="hover:bg-muted/20">
                                    <TableCell className="font-semibold text-sm py-3">{supply.location}</TableCell>
                                    <TableCell className="text-sm py-3">{supply.item}</TableCell>
                                    <TableCell className="text-right font-bold text-base py-3">{supply.qty}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground py-3">{supply.vehicles}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

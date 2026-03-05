import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Play, Download, Loader2, FileDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function AdminDistributionToolbar({
    isAutoPlan,
    onAutoPlanToggle
}: {
    isAutoPlan: boolean;
    onAutoPlanToggle: (checked: boolean) => void
}) {
    const { toast } = useToast();
    const [isAllocating, setIsAllocating] = useState(false);
    const [showAllocationPlan, setShowAllocationPlan] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleRunAllocation = () => {
        setIsAllocating(true);
        // Simulate real-time complex routing algorithm
        setTimeout(() => {
            setIsAllocating(false);
            setShowAllocationPlan(true);
            toast({
                title: "Allocation Processing Complete",
                description: "VRP parameters optimized. New distribution model generated.",
            });
        }, 3000);
    };

    const handleExportPlan = () => {
        setIsExporting(true);
        setTimeout(() => {
            setIsExporting(false);
            toast({
                title: "Dynamic Plan Exported",
                description: "Strategic_Distribution_Plan_v2.4.pdf is downloading.",
            });
            // Mock download action for visual effect
            const operationsPlan = `
Operational Dispatch Actions

Routing Policy: AET
Load Condition: HIGH
Priority Weighted Response Time: 165
Solver Calls: 11
System Nervousness: 4
Trigger Precision: 0.063
Fuel Savings: 18.4%
Turnaround Improvement: -28 minutes
Logistics Integrity Score: 97

Dispatch Actions

Convoy Reroute
Origin: Sector B
Destination: Zone A
Convoys Redirected: 4
Priority Level: HIGH
Estimated Arrival Time: 12 minutes

Drone Supply Deployment
Resource: Thermal Blankets
Quantity: 5,000
Delivery Mode: Autonomous Drone Fleet
Target Area: Isolated Disaster Quadrants

Operational Ratings

Feasibility Under Peak Load: HIGH
Operational Stability: HIGH
            `.trim();

            const link = document.createElement('a');
            link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(operationsPlan);
            link.download = 'Operations_Manifest_AET_HIGH.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, 1500);
    };

    return (
        <>
            <Card className="p-3 w-full xl:w-auto shrink-0 flex flex-col justify-center gap-3 border-dashed bg-muted/10">
                <div className="text-sm font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Global Distribution Planning
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 border-r pr-3 mr-1">
                        <Switch checked={isAutoPlan} onCheckedChange={onAutoPlanToggle} id="auto-plan" />
                        <Label htmlFor="auto-plan" className="text-xs cursor-pointer">Auto-plan Dispatch</Label>
                    </div>
                    <Button
                        onClick={handleRunAllocation}
                        disabled={isAllocating}
                        variant="secondary"
                        size="sm"
                    >
                        {isAllocating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                        {isAllocating ? 'Optimizing Routes...' : 'Run Dynamic Allocation'}
                    </Button>
                    <Button
                        onClick={handleExportPlan}
                        disabled={isExporting}
                        variant="outline"
                        size="sm"
                    >
                        {isExporting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
                        Export Manifest
                    </Button>
                </div>
            </Card>

            <Dialog open={showAllocationPlan} onOpenChange={setShowAllocationPlan}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Allocation Simulation Insights</DialogTitle>
                        <DialogDescription>
                            Heuristic routing optimization complete. Real-time dynamic allocations structured below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 border rounded-md bg-muted/20 space-y-3">
                            <h4 className="font-semibold text-sm">Zone A Priority Override</h4>
                            <p className="text-sm text-muted-foreground">
                                Critical medical supply shortage detected in Zone A. The system triggers an event-based routing update, intercepting 4 transport convoys from Sector B and redirecting them to Zone A. Estimated arrival time after reroute: 12 minutes.
                            </p>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[78%]"></div>
                            </div>
                        </div>

                        <div className="p-4 border rounded-md bg-muted/20 space-y-3">
                            <h4 className="font-semibold text-sm">Automated Supply Rebalancing</h4>
                            <p className="text-sm text-muted-foreground">
                                Autonomous logistics drones deployed to deliver 5,000 thermal blankets to isolated quadrants. Rebalancing completed while maintaining low system nervousness and stable routing.
                            </p>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[100%]"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center pt-2">
                            <div className="border p-3 rounded-md shadow-sm bg-background">
                                <div className="text-xs text-muted-foreground">Priority Response Time</div>
                                <div className="font-bold text-lg">165 mins</div>
                            </div>
                            <div className="border p-3 rounded-md shadow-sm bg-background">
                                <div className="text-xs text-muted-foreground">System Nervousness</div>
                                <div className="font-bold text-lg text-green-600">4 Instability</div>
                            </div>
                            <div className="border p-3 rounded-md shadow-sm bg-background">
                                <div className="text-xs text-muted-foreground">Trigger Precision</div>
                                <div className="font-bold text-lg text-blue-600">6.3%</div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAllocationPlan(false)}>Dismiss Overview</Button>
                        <Button onClick={handleExportPlan} className="gap-2">
                            <FileDown className="h-4 w-4" /> Export Operations Plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

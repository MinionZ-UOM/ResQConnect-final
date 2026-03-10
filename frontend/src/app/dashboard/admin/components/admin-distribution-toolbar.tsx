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
        setTimeout(() => {
            setIsAllocating(false);
            setShowAllocationPlan(true);
            toast({
                title: "Allocation Complete",
                description: "New distribution plan generated successfully.",
            });
        }, 3000);
    };

    const handleExportPlan = () => {
        setIsExporting(true);
        setTimeout(() => {
            setIsExporting(false);
            toast({
                title: "Plan Exported",
                description: "Distribution_Plan.pdf is downloading.",
            });
            const operationsPlan = `
Operational Dispatch Plan
=========================

Routing Policy: Smart Re-plan (AET)
Load Condition: HIGH
Avg. Response Time: 165 min
Fuel Savings: 18.4%

Dispatch Actions
-----------------

1. Convoy Reroute
   From: Sector B → Zone A
   Convoys Redirected: 4
   Priority: HIGH
   ETA: 12 minutes

2. Supply Deployment
   Item: Thermal Blankets
   Quantity: 5,000
   Target: Isolated Disaster Areas
            `.trim();

            const link = document.createElement('a');
            link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(operationsPlan);
            link.download = 'Distribution_Plan.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, 1500);
    };

    return (
        <>
            <Card className="p-4 w-full flex flex-col gap-4 border-2 border-dashed bg-muted/10">
                <div className="text-base font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5" /> Distribution Planning
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 border-r pr-4 mr-1">
                        <Switch checked={isAutoPlan} onCheckedChange={onAutoPlanToggle} id="auto-plan" />
                        <Label htmlFor="auto-plan" className="text-sm cursor-pointer">Auto-plan Dispatch</Label>
                    </div>
                    <Button
                        onClick={handleRunAllocation}
                        disabled={isAllocating}
                        variant="secondary"
                        size="default"
                        className="gap-2"
                    >
                        {isAllocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        {isAllocating ? 'Running...' : 'Run Allocation'}
                    </Button>
                    <Button
                        onClick={handleExportPlan}
                        disabled={isExporting}
                        variant="outline"
                        size="default"
                        className="gap-2"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export Plan
                    </Button>
                </div>
            </Card>

            <Dialog open={showAllocationPlan} onOpenChange={setShowAllocationPlan}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Allocation Results</DialogTitle>
                        <DialogDescription className="text-sm">
                            Route optimization complete. Here are the recommended dispatch actions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-5 border-2 rounded-xl bg-muted/20 space-y-3">
                            <h4 className="font-bold text-base">Priority Reroute — Zone A</h4>
                            <p className="text-sm text-muted-foreground">
                                Medical supply shortage detected in Zone A. 4 transport convoys rerouted from Sector B. Estimated arrival: 12 minutes.
                            </p>
                            <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[78%] rounded-full"></div>
                            </div>
                        </div>

                        <div className="p-5 border-2 rounded-xl bg-muted/20 space-y-3">
                            <h4 className="font-bold text-base">Supply Deployment</h4>
                            <p className="text-sm text-muted-foreground">
                                5,000 thermal blankets deployed to isolated disaster areas. Delivery in progress.
                            </p>
                            <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[100%] rounded-full"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="border-2 p-4 rounded-xl bg-background text-center">
                                <div className="text-sm text-muted-foreground mb-1">Avg. Response Time</div>
                                <div className="font-bold text-2xl">165 min</div>
                            </div>
                            <div className="border-2 p-4 rounded-xl bg-background text-center">
                                <div className="text-sm text-muted-foreground mb-1">Fuel Savings</div>
                                <div className="font-bold text-2xl text-green-600">18.4%</div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAllocationPlan(false)}>Close</Button>
                        <Button onClick={handleExportPlan} className="gap-2">
                            <FileDown className="h-4 w-4" /> Export Plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

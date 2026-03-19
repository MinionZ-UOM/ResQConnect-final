import { Card } from "@/components/ui/card";

export type AdminKPIs = {
    totalRequests: number;
    totalSuggestedResources: number;
    pendingResources: number;
    approvedResources: number;
    rejectedResources: number;
    requestsWithPending: number;
    filteredResults: number;
};

export function AdminKpiStrip({ kpis }: { kpis: AdminKPIs }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Card className="p-4 bg-muted/30 flex flex-col justify-center gap-1">
                <div className="text-sm text-muted-foreground font-medium">Total Requests</div>
                <div className="text-2xl font-bold">{kpis.totalRequests}</div>
            </Card>
            <Card className="p-4 bg-muted/30 flex flex-col justify-center gap-1">
                <div className="text-sm text-muted-foreground font-medium">Suggested Resources</div>
                <div className="text-2xl font-bold">{kpis.totalSuggestedResources}</div>
            </Card>
            <Card className="p-4 bg-muted/30 flex flex-col justify-center gap-1 border-2 border-blue-200 dark:border-blue-900">
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Pending</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{kpis.pendingResources}</div>
            </Card>
            <Card className="p-4 bg-muted/30 flex flex-col justify-center gap-1 border-2 border-green-200 dark:border-green-900">
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">Approved</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{kpis.approvedResources}</div>
            </Card>
            <Card className="p-4 bg-muted/30 flex flex-col justify-center gap-1 border-2 border-red-200 dark:border-red-900">
                <div className="text-sm text-red-600 dark:text-red-400 font-medium">Rejected</div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{kpis.rejectedResources}</div>
            </Card>
            <Card className="p-4 bg-muted/30 flex flex-col justify-center gap-1">
                <div className="text-sm text-muted-foreground font-medium">Requests w/ Pending</div>
                <div className="text-2xl font-bold">{kpis.requestsWithPending}</div>
            </Card>
            <Card className="p-4 bg-muted/30 flex flex-col justify-center gap-1">
                <div className="text-sm text-muted-foreground font-medium">Filtered Results</div>
                <div className="text-2xl font-bold">{kpis.filteredResults}</div>
            </Card>
        </div>
    );
}

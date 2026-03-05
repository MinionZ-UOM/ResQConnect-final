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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 flex-grow">
            <Card className="p-3 bg-muted/30 flex flex-col justify-center">
                <div className="text-xs text-muted-foreground mb-1 leading-tight">Total Requests</div>
                <div className="text-xl font-bold">{kpis.totalRequests}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center">
                <div className="text-xs text-muted-foreground mb-1 leading-tight">Suggested Resources</div>
                <div className="text-xl font-bold">{kpis.totalSuggestedResources}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center border border-blue-200 dark:border-blue-900">
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 leading-tight">Pending Resources</div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{kpis.pendingResources}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center border border-green-200 dark:border-green-900">
                <div className="text-xs text-green-600 dark:text-green-400 mb-1 leading-tight">Approved Resources</div>
                <div className="text-xl font-bold text-green-700 dark:text-green-300">{kpis.approvedResources}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center border border-red-200 dark:border-red-900">
                <div className="text-xs text-red-600 dark:text-red-400 mb-1 leading-tight">Rejected Resources</div>
                <div className="text-xl font-bold text-red-700 dark:text-red-300">{kpis.rejectedResources}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center">
                <div className="text-xs text-muted-foreground mb-1 leading-tight">Requests w/ Pending</div>
                <div className="text-xl font-bold">{kpis.requestsWithPending}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center">
                <div className="text-xs text-muted-foreground mb-1 leading-tight">Filtered Results</div>
                <div className="text-xl font-bold">{kpis.filteredResults}</div>
            </Card>
        </div>
    );
}

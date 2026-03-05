import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Request } from "@/lib/types/request";
import type { WorkflowResource } from "@/lib/types/workflow";

export type AdminRequestDetailsDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    request: Request | null;
    resources: WorkflowResource[];
    disasterName: string;
    locationText: string;
};

export function AdminRequestDetailsDialog({
    isOpen,
    onOpenChange,
    request,
    resources,
    disasterName,
    locationText,
}: AdminRequestDetailsDialogProps) {
    const counts = {
        pending: resources.filter((r) => r.approvalStatus === "pending").length,
        approved: resources.filter((r) => r.approvalStatus === "approved").length,
        rejected: resources.filter((r) => r.approvalStatus === "rejected").length,
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">{request?.title}</DialogTitle>
                    <DialogDescription>
                        {disasterName} · {locationText}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-3 py-4">
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-center border border-blue-100 dark:border-blue-900">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{counts.pending}</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Pending</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center border border-green-100 dark:border-green-900">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{counts.approved}</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Approved</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg text-center border border-red-100 dark:border-red-900">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{counts.rejected}</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Rejected</div>
                    </div>
                </div>

                <div className="space-y-3 mt-2">
                    <h3 className="text-sm font-semibold border-b pb-2">Resource Details</h3>
                    <div className="border rounded-md overflow-hidden bg-muted/20">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Resource</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="w-[100px] text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resources.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium">{(row as any).resourceName || (row as any).name || row.type || "Unknown"}</TableCell>
                                        <TableCell className="text-right">
                                            {(row as any).quantity || row.totalQuantity} {(row as any).unit || ""}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={
                                                    row.approvalStatus === "approved"
                                                        ? "default"
                                                        : row.approvalStatus === "rejected"
                                                            ? "destructive"
                                                            : "secondary"
                                                }
                                            >
                                                {row.approvalStatus}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {resources.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                                            No resources found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

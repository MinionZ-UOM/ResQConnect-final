"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Check, X, MapPin } from "lucide-react";
import Image from "next/image";
import type { Disaster } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Props = {
  disaster: Disaster;
  onEdit?: (d: Disaster) => void;
  onDelete?: (d: Disaster) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  isJoined?: boolean;
};

export default function DisasterCard({
  disaster,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onJoin,
  onLeave,
  isJoined = false,
}: Props) {
  const showEditDelete = onEdit || onDelete;
  const showApproveReject = disaster.status === "Pending" && (onApprove || onReject);
  const showParticipationAction =
    disaster.status !== "Pending" && (onJoin || (isJoined && onLeave));

  return (
    <Card className="flex flex-col h-full">
      {/* Image */}
      <div className="relative">
        <Image
          src={disaster.imageUrl ?? "/placeholder-disaster.jpg"}
          alt={disaster.name}
          width={400}
          height={240}
          className="w-full h-60 object-cover"
        />
        {/* Top-right action icons - only show if onEdit or onDelete provided */}
        {showEditDelete && (
          <div className="absolute top-2 right-2 flex gap-2">
            {/* Edit button */}
            {onEdit && (
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-white/70 hover:bg-white"
                onClick={() => onEdit(disaster)}
              >
                <Pencil className="h-4 w-4 text-blue-600" />
              </Button>
            )}

            {/* Delete button with confirmation */}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 bg-white/70 hover:bg-white"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Disaster?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete{" "}
                      <span className="font-semibold">{disaster.name}</span>? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => onDelete(disaster)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 w-full bg-black/50 text-white px-3 py-2">
          <h3 className="text-sm font-semibold truncate">{disaster.name}</h3>
        </div>
      </div>

      <CardContent className="pt-6 flex-1 flex flex-col">
        <p className="text-sm sm:text-base text-slate-700 line-clamp-3">
          {disaster.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="h-7 rounded-full border-slate-300/60 bg-slate-500/5 text-slate-700 inline-flex items-center gap-1 px-2.5"
            title={disaster.location.address}
          >
            <MapPin className="h-3.5 w-3.5 opacity-70" />
            <span className="truncate max-w-[18rem]">
              {disaster.location.address}
            </span>
          </Badge>

          {disaster.status === "Pending" && (
            <Badge
              variant="outline"
              className="bg-yellow-100 text-yellow-700 border-yellow-300"
            >
              Pending
            </Badge>
          )}
        </div>

        {/* Footer actions for Pending (Approve/Reject) */}
        {showApproveReject && (
          <div className="flex gap-2 pt-6 mt-auto">
            {onApprove && (
              <Button className="gap-2" onClick={() => onApprove(disaster.id)}>
                <Check className="h-4 w-4" /> Approve
              </Button>
            )}

            {onReject && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Disaster?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject{" "}
                      <span className="font-semibold">{disaster.name}</span>? This will
                      remove it permanently.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => onReject(disaster.id)}
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {/* Footer action for registered disasters (JOIN/LEAVE) */}
        {showParticipationAction && (
          <div className="flex pt-6 mt-auto">
            {isJoined && onLeave ? (
              <Button
                className="w-full gap-2"
                variant="destructive"
                onClick={() => onLeave(disaster.id)}
              >
                <X className="h-4 w-4" /> Leave
              </Button>
            ) : (
              onJoin && (
                <Button className="w-full gap-2" onClick={() => onJoin(disaster.id)}>
                  <Check className="h-4 w-4" /> JOIN
                </Button>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { allUsers } from "@/lib/mock-data";  // Replace with your actual data source
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";

// Define role colors for badges
const roleColors = {
  admin: "bg-red-500/20 text-red-700 border-red-500/30",
  responder: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  volunteer: "bg-green-500/20 text-green-700 border-green-500/30",
  individual: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
};

export default function UserCheckingCard({ className }: { className?: string }) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
      </CardHeader>
      <CardContent className="max-h-[250px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("capitalize", roleColors[user.role])}>
                    {user.role}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

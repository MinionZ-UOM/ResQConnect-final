"use client"

import { useState } from "react"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { mockUsers } from "@/lib/mock-data"
import type { User } from "@/lib/types"

ChartJS.register(ArcElement, Tooltip, Legend)

interface UserOverviewProps {
  view: "chart" | "table"
  setView: (view: "chart" | "table") => void
}

export function UserOverview({ view }: UserOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("All")

  const users: User[] = Object.values(mockUsers)

  // Filtering for table
  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
    const matchesRole = roleFilter === "All" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Role counts for chart
  const roleCounts = {
    Admin: users.filter((u) => u.role === "admin").length,
    Responder: users.filter((u) => u.role === "responder").length,
    Volunteer: users.filter((u) => u.role === "volunteer").length,
    Affected: users.filter((u) => u.role === "individual").length,
  }

  const chartData = {
    labels: Object.keys(roleCounts),
    datasets: [
      {
        data: Object.values(roleCounts),
        backgroundColor: [
          "rgba(239, 68, 68, 0.6)",  // Admin
          "rgba(59, 130, 246, 0.6)", // Responder
          "rgba(16, 185, 129, 0.6)", // Volunteer
          "rgba(250, 204, 21, 0.6)", // Affected
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(250, 204, 21, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "right" as const } },
  }

  return (
    <div className="flex flex-col h-[300px]">
      {/* Search + Filter row only in table view */}
      {view === "table" && (
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[200px] h-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="responder">Responders</SelectItem>
                <SelectItem value="volunteer">Volunteers</SelectItem>
                <SelectItem value="individual">Affected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Chart or Table */}
      <div className="flex-1 overflow-hidden"> {/* Ensures content fits and scrolls if needed */}
        {view === "chart" ? (
          <div className="h-full">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="rounded-md border overflow-y-auto max-h-[250px]"> {/* Added max height for scrollable table */}
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.role === "responder"
                            ? "border-blue-500 text-blue-500"
                            : user.role === "volunteer"
                            ? "border-green-500 text-green-500"
                            : user.role === "admin"
                            ? "border-red-500 text-red-500"
                            : "border-yellow-500 text-yellow-600"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

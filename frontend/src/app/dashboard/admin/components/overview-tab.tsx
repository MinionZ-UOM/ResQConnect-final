"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/stat-card';
import UserCheckingCard from './user-management-tab';
import { UserOverview } from './user-overview';
import { Users, GitPullRequest, Package, CheckCircle, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import FeedbackCard from './feedback-card';
import { mockTasks, mockResources, AdminChartResources } from '@/lib/mock-data';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";

// Task Status Chart Data
const chartData = [
  { status: 'Pending', count: mockTasks.filter((t) => t.status === 'Pending').length, fill: 'var(--color-pending)' },
  { status: 'Approved', count: mockTasks.filter((t) => t.status === 'Approved').length, fill: 'var(--color-approved)' },
  { status: 'Assigned', count: mockTasks.filter((t) => t.status === 'Assigned').length, fill: 'var(--color-assigned)' },
  { status: 'In Progress', count: mockTasks.filter((t) => t.status === 'In Progress').length, fill: 'hsla(210, 38%, 33%, 1.00)' }, // Hardcoded light blue color
  { status: 'Completed', count: mockTasks.filter((t) => t.status === 'Completed').length, fill: 'var(--color-completed)' },
].map((data) => ({
  ...data,
  count: Number.isInteger(data.count) ? data.count : 0,
}));

const chartConfig = {
  count: { label: 'Tasks', color: 'hsl(var(--chart-5))' }, // Added color property
  pending: { label: 'Pending', color: 'hsl(var(--muted-foreground))' },
  approved: { label: 'Approved', color: 'hsl(var(--primary))' },
  assigned: { label: 'Assigned', color: 'hsl(var(--accent))' },
  'in-progress': { label: 'In Progress', color: 'hsl(var(--chart-4))' },
  completed: { label: 'Completed', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

// Resource Allocation Chart Data
const resourceChartData = AdminChartResources.map((resource, index) => {
  const chartKeys = Object.keys(chartConfig) as Array<keyof typeof chartConfig>;
  return {
    name: resource.name,
    count: resource.quantity,
    fill: chartConfig[chartKeys[index % chartKeys.length]].color,
  };
});

const resourceChartConfig = {
  count: { label: 'Quantity', color: 'hsl(var(--chart-3))' },
  name: { label: 'Resource Name', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

export default function OverviewTab() {
  const totalTasks = mockTasks.length;
  const completedTasks = mockTasks.filter((t) => t.status === 'Completed').length;
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0;

  const [selectedChart, setSelectedChart] = useState("taskStatus");
  const [userView, setUserView] = useState<"chart" | "table">("chart");

  const handleSelectChange = (value: string) => setSelectedChart(value);

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Requests" value={totalTasks} description="All submitted help requests" icon={GitPullRequest} />
        <StatCard title="Active Volunteers" value={4} description="Volunteers currently on tasks" icon={Users} />
        <StatCard
          title="Completion Rate"
          value={Number(completionRate)}
          description={`${completedTasks} of ${totalTasks} tasks completed (${completionRate}%)`}
          icon={CheckCircle}
        />
        <FeedbackCard
          title="User Satisfaction"
          goodValue={18}
          badValue={5}
          description="User satisfaction rating"
          icon={Smile}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conditionally render the selected chart */}
        {selectedChart === "taskStatus" ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>A breakdown of all tasks by their current status.</CardDescription>
              </div>
              <Select onValueChange={handleSelectChange} defaultValue={selectedChart}>
                <SelectTrigger className="w-[220px] p-2 border rounded-md shadow-sm bg-white hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
                  <SelectValue placeholder="Select Chart" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="taskStatus">Task Status Distribution</SelectItem>
                  <SelectItem value="resourceAllocation">Resource Allocation</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="status" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickFormatter={(value) => Number.isInteger(value) ? value : ''} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        ) : selectedChart === "resourceAllocation" ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Resource Allocation</CardTitle>
                <CardDescription>A breakdown of resources by their current allocation.</CardDescription>
              </div>
              <Select onValueChange={handleSelectChange} defaultValue={selectedChart}>
                <SelectTrigger className="w-[220px] p-2 border rounded-md shadow-sm bg-white hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
                  <SelectValue placeholder="Select Chart" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="taskStatus">Task Status Distribution</SelectItem>
                  <SelectItem value="resourceAllocation">Resource Allocation</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ChartContainer config={resourceChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceChartData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickFormatter={(value) => Number.isInteger(value) ? value : ''} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        ) : null}
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>User Management</CardTitle>
            <div className="flex space-x-2">
              <button
                onClick={() => setUserView("chart")}
                className={`px-3 py-1.5 rounded-md text-md ${userView === "chart" ? "bg-slate-200 dark:bg-slate-700 font-semibold" : "text-slate-600"}`}
              >
                Chart
              </button>
              <button
                onClick={() => setUserView("table")}
                className={`px-3 py-1.5 rounded-md text-md ${userView === "table" ? "bg-slate-200 dark:bg-slate-700 font-semibold" : "text-slate-600"}`}
              >
                Table
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <UserOverview view={userView} setView={setUserView} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
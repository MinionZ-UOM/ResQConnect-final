"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, ClipboardList, Package, AlertTriangle, Radar } from 'lucide-react';
import AdminTasksTab from "./tab-sections/admin-tasks-tab";
import AdminResourcesTab from "./tab-sections/admin-resources-tab";
import AdminDisastersTab from "./tab-sections/admin-disaster-tab";
import AdminSimulationTab from "./tab-sections/admin-simulation-tab";
import OverviewTab from "./components/overview-tab";

export default function ResponderDashboardPage() {

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="dashboard" className="flex-col sm:flex-row h-auto gap-2 p-3"><LayoutDashboard className="w-5 h-5" /><span>Dashboard</span></TabsTrigger>
          <TabsTrigger value="tasks" className="flex-col sm:flex-row h-auto gap-2 p-3"><ClipboardList className="w-5 h-5" /><span>Task Suggestions</span></TabsTrigger>
          <TabsTrigger value="resources" className="flex-col sm:flex-row h-auto gap-2 p-3"><Package className="w-5 h-5" /><span>Resources</span></TabsTrigger>
          <TabsTrigger value="simulation" className="flex-col sm:flex-row h-auto gap-2 p-3"><Radar className="w-5 h-5" /><span>Distribution</span></TabsTrigger>
          <TabsTrigger value="disasters" className="flex-col sm:flex-row h-auto gap-2 p-3"><AlertTriangle className="w-5 h-5" /><span>Disasters</span></TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4" id="tasks">
          <AdminTasksTab />
        </TabsContent>
        <TabsContent value="resources" className="mt-4" id="resources">
          <AdminResourcesTab />
        </TabsContent>
        <TabsContent value="disasters" className="mt-4" id="disasters">
          <AdminDisastersTab />
        </TabsContent>
        <TabsContent value="simulation" className="mt-4" id="simulation">
          <AdminSimulationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText , Check, Map, MessageSquare, Package } from 'lucide-react';
import MyTasksTab from "./tab-sections/my-tasks-tab";
import ChatTab from "../components/chat-tab";
import MapTab from "../components/map-tab";
import FieldReportTab from "./tab-sections/field-report-tab";
import ResourceManagementTab from "../components/resource-management-tab";
import { FieldReportCreate } from "@/lib/types";

export default function VolunteerDashboardPage() {
  // What the form will submit (server adds id/reporter/createdAt)
  const handleSubmitReport = (data: FieldReportCreate) => {};

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="mytasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="mytasks" className="flex-col sm:flex-row h-auto gap-2 p-3"><Check className="w-5 h-5"/><span>My Tasks</span></TabsTrigger>
          <TabsTrigger value="report" className="flex-col sm:flex-row h-auto gap-2 p-3"><FileText  className="w-5 h-5"/><span>Report Observation</span></TabsTrigger>
          <TabsTrigger value="resources" className="flex-col sm:flex-row h-auto gap-2 p-3"><Package className="w-5 h-5"/><span>Resources</span></TabsTrigger>
          <TabsTrigger value="map" className="flex-col sm:flex-row h-auto gap-2 p-3"><Map className="w-5 h-5"/><span>Map</span></TabsTrigger>
          <TabsTrigger value="chat" className="flex-col sm:flex-row h-auto gap-2 p-3"><MessageSquare className="w-5 h-5"/><span>Chat</span></TabsTrigger>
        </TabsList>
        <TabsContent value="mytasks" className="mt-4">
          <MyTasksTab />
        </TabsContent>
        <TabsContent value="report" className="mt-4" id="report">
          <FieldReportTab onSubmitReport={handleSubmitReport} />
        </TabsContent>
        <TabsContent value="resources" className="mt-4" id="resources">
          <ResourceManagementTab />
        </TabsContent>
        <TabsContent value="map" className="mt-4" id="map">
          <MapTab />
        </TabsContent>
        <TabsContent value="chat" className="mt-4" id="chat">
          <ChatTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

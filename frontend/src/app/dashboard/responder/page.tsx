"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, MessageSquare, Package, Home } from 'lucide-react';
import ResponderDashboardTab from "./tab-sections/responder-dashboard-tab";
import ChatTab from "../components/chat-tab";
import MapTab from "../components/map-tab";
import ResourceManagementTab from "../components/resource-management-tab";

export default function ResponderDashboardPage() {

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 h-auto">
          <TabsTrigger value="dashboard" className="flex-col sm:flex-row h-auto gap-2 p-3"><Home className="w-5 h-5"/><span>Dashboard</span></TabsTrigger>
          <TabsTrigger value="resources" className="flex-col sm:flex-row h-auto gap-2 p-3"><Package className="w-5 h-5"/><span>Resources</span></TabsTrigger>
          <TabsTrigger value="map" className="flex-col sm:flex-row h-auto gap-2 p-3"><Map className="w-5 h-5"/><span>Map</span></TabsTrigger>
          <TabsTrigger value="chat" className="flex-col sm:flex-row h-auto gap-2 p-3"><MessageSquare className="w-5 h-5"/><span>Chat</span></TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-4">
          <ResponderDashboardTab />
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
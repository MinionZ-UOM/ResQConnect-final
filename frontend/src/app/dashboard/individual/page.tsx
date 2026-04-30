"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeartHandshake, ListChecks, Map, MessageSquare } from 'lucide-react';
import HelpRequestTab from "./tab-sections/help-request-tab";
import TrackRequestsTab from "./tab-sections/track-requests-tab";
import ChatTab from "../components/chat-tab";
import MapTab from "../components/map-tab";

export default function IndividualDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="help" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 h-auto">
          <TabsTrigger value="help" className="flex-col sm:flex-row h-auto gap-2 p-3">
            <HeartHandshake className="w-5 h-5" /> <span>Request Help</span>
          </TabsTrigger>
          <TabsTrigger value="track" className="flex-col sm:flex-row h-auto gap-2 p-3">
            <ListChecks className="w-5 h-5" /> <span>Track Requests</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex-col sm:flex-row h-auto gap-2 p-3">
            <Map className="w-5 h-5" /> <span>Map</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex-col sm:flex-row h-auto gap-2 p-3">
            <MessageSquare className="w-5 h-5" /> <span>Chat</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="help" className="mt-4">
          <HelpRequestTab />
        </TabsContent>
        <TabsContent value="track" className="mt-4" id="track">
          <TrackRequestsTab />
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

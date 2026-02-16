"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Dynamically import MapView only on client
const MapView = dynamic(
  () => import("@/components/ui/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Loading map…
      </div>
    ),
  }
);

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface DisasterLocation {
  id: string;
  name: string;
  location: Location;
}

interface Request {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  location: Location;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  status: string;
  quantity?: number;
  location: Location;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Fixed scenario data ───
const FIXED_DISASTERS: DisasterLocation[] = [
  {
    id: "d1",
    name: "Flood in Colombo",
    location: {
      latitude: 6.9271,
      longitude: 79.8612,
      address: "Colombo Municipal Council, Colombo",
    },
  },
  {
    id: "d2",
    name: "Landslide in Kandy",
    location: {
      latitude: 7.2906,
      longitude: 80.6337,
      address: "Kandy City Center, Kandy",
    },
  },
  {
    id: "d3",
    name: "Cyclone near Jaffna",
    location: {
      latitude: 9.6615,
      longitude: 80.0255,
      address: "Jaffna Town",
    },
  },
];

const FIXED_REQUESTS: Request[] = [
  {
    id: "d1-REQ-1",
    title: "Evacuation Support - Wellawatte",
    description: "Families trapped by rising waters near Wellawatte canal.",
    type: "Rescue",
    status: "In Progress",
    priority: "High",
    location: {
      latitude: 6.874,
      longitude: 79.8616,
      address: "Wellawatte, Colombo",
    },
    createdBy: "colombo-emergency-ops",
    createdAt: new Date("2024-05-20T06:00:00Z"),
    updatedAt: new Date("2024-05-20T09:15:00Z"),
  },
  {
    id: "d1-REQ-2",
    title: "Medical Aid - Maradana Relief Camp",
    description: "Need first-aid kits and nurses at the Maradana temple relief site.",
    type: "Medical",
    status: "New",
    priority: "Medium",
    location: {
      latitude: 6.9338,
      longitude: 79.8645,
      address: "Maradana, Colombo",
    },
    createdBy: "colombo-health-services",
    createdAt: new Date("2024-05-20T04:30:00Z"),
    updatedAt: new Date("2024-05-20T04:30:00Z"),
  },
  {
    id: "d1-REQ-3",
    title: "Food Distribution - Kelaniya",
    description: "Requesting cooked meals for 120 evacuees sheltered at Kelaniya University.",
    type: "Supply",
    status: "In Progress",
    priority: "High",
    location: {
      latitude: 6.9685,
      longitude: 79.9151,
      address: "Kelaniya University Grounds",
    },
    createdBy: "colombo-district-secretariat",
    createdAt: new Date("2024-05-20T07:45:00Z"),
    updatedAt: new Date("2024-05-20T08:20:00Z"),
  },
  {
    id: "d2-REQ-1",
    title: "Rescue Crew - Peradeniya Landslide",
    description: "Volunteer rescue teams needed to clear debris near Peradeniya road.",
    type: "Rescue",
    status: "In Progress",
    priority: "High",
    location: {
      latitude: 7.2716,
      longitude: 80.5956,
      address: "Peradeniya, Kandy",
    },
    createdBy: "central-provincial-council",
    createdAt: new Date("2024-05-19T22:00:00Z"),
    updatedAt: new Date("2024-05-20T02:10:00Z"),
  },
  {
    id: "d2-REQ-2",
    title: "Temporary Shelter - Katugastota",
    description: "Requesting tarpaulins and bedding for displaced families in Katugastota school.",
    type: "Supply",
    status: "New",
    priority: "Medium",
    location: {
      latitude: 7.3119,
      longitude: 80.6364,
      address: "Katugastota Central College",
    },
    createdBy: "kandy-disaster-office",
    createdAt: new Date("2024-05-20T03:30:00Z"),
    updatedAt: new Date("2024-05-20T03:30:00Z"),
  },
  {
    id: "d2-REQ-3",
    title: "Medical Transport - Kandy General",
    description: "Need 4x4 vehicle to transfer injured residents to Kandy General Hospital.",
    type: "Medical",
    status: "Completed",
    priority: "High",
    location: {
      latitude: 7.2936,
      longitude: 80.6409,
      address: "Kandy General Hospital",
    },
    createdBy: "kandy-general-hospital",
    createdAt: new Date("2024-05-19T18:15:00Z"),
    updatedAt: new Date("2024-05-20T01:00:00Z"),
  },
  {
    id: "d3-REQ-1",
    title: "Evacuation Boats - Karainagar",
    description: "Fishing boats required to move families from inundated Karainagar islets.",
    type: "Rescue",
    status: "New",
    priority: "High",
    location: {
      latitude: 9.5082,
      longitude: 79.9529,
      address: "Karainagar Pier",
    },
    createdBy: "jaffna-naval-command",
    createdAt: new Date("2024-05-20T05:10:00Z"),
    updatedAt: new Date("2024-05-20T05:10:00Z"),
  },
  {
    id: "d3-REQ-2",
    title: "Satellite Phones - Point Pedro",
    description: "Point Pedro divisional office needs satellite phones due to network outage.",
    type: "Supply",
    status: "In Progress",
    priority: "Medium",
    location: {
      latitude: 9.8167,
      longitude: 80.2331,
      address: "Point Pedro Divisional Secretariat",
    },
    createdBy: "jaffna-district-secretariat",
    createdAt: new Date("2024-05-19T21:40:00Z"),
    updatedAt: new Date("2024-05-20T02:55:00Z"),
  },
  {
    id: "d3-REQ-3",
    title: "Relief Supplies - Chavakachcheri",
    description: "Essential food packs required for 80 families sheltered at Chavakachcheri.",
    type: "Supply",
    status: "Completed",
    priority: "Medium",
    location: {
      latitude: 9.6613,
      longitude: 80.1693,
      address: "Chavakachcheri Community Hall",
    },
    createdBy: "jaffna-social-services",
    createdAt: new Date("2024-05-19T16:20:00Z"),
    updatedAt: new Date("2024-05-19T22:45:00Z"),
  },
];

const FIXED_RESOURCES: Resource[] = [
  {
    id: "r1",
    name: "Colombo Central Warehouse",
    type: "Water",
    status: "Available",
    quantity: 1200,
    location: {
      latitude: 6.933,
      longitude: 79.884,
      address: "D. R. Wijewardena Mawatha, Colombo",
    },
    createdAt: new Date("2024-05-19T10:00:00Z"),
    updatedAt: new Date("2024-05-20T08:45:00Z"),
  },
  {
    id: "r2",
    name: "Kandy Field Hospital",
    type: "Medical",
    status: "In Use",
    quantity: 45,
    location: {
      latitude: 7.2919,
      longitude: 80.6073,
      address: "Queen's Hotel Grounds, Kandy",
    },
    createdAt: new Date("2024-05-19T11:20:00Z"),
    updatedAt: new Date("2024-05-20T06:15:00Z"),
  },
  {
    id: "r3",
    name: "Jaffna Logistics Hub",
    type: "Food",
    status: "Available",
    quantity: 600,
    location: {
      latitude: 9.6741,
      longitude: 80.011,
      address: "AB21 Road, Jaffna",
    },
    createdAt: new Date("2024-05-18T23:50:00Z"),
    updatedAt: new Date("2024-05-20T04:05:00Z"),
  },
  {
    id: "r4",
    name: "Point Pedro Fuel Depot",
    type: "Fuel",
    status: "Available",
    quantity: 18,
    location: {
      latitude: 9.8251,
      longitude: 80.2299,
      address: "Point Pedro Harbour",
    },
    createdAt: new Date("2024-05-19T09:30:00Z"),
    updatedAt: new Date("2024-05-20T05:40:00Z"),
  },
];

export default function MapTab() {
  // ─── Disasters ───
  const [disasters, setDisasters] = useState<DisasterLocation[]>([]);
  const [isLoadingDisasters, setIsLoadingDisasters] = useState(true);

  useEffect(() => {
    setIsLoadingDisasters(true);
    const timer = setTimeout(() => {
      setDisasters(FIXED_DISASTERS);
      setIsLoadingDisasters(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // ─── Requests ───
  const [requests, setRequests] = useState<Request[]>([]);
  useEffect(() => {
    setRequests(FIXED_REQUESTS);
  }, []);

  // ─── Resources ───
  const [resources, setResources] = useState<Resource[]>([]);
  useEffect(() => {
    setResources(FIXED_RESOURCES);
  }, []);

  const resourceGroups = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [resources]);

  // ─── UI State ───
  const [selectedDisasterId, setSelectedDisasterId] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedResourceType, setSelectedResourceType] = useState("");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ── Filters ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Disasters</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDisasters ? (
                <p className="text-sm sm:text-base text-slate-700">Loading…</p>
              ) : (
                <Select value={selectedDisasterId} onValueChange={setSelectedDisasterId}>
                  <SelectTrigger><SelectValue placeholder="Select a Disaster" /></SelectTrigger>
                  <SelectContent>
                    {disasters.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Requests</CardTitle></CardHeader>
            <CardContent>
              <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                <SelectTrigger><SelectValue placeholder="Select a Request" /></SelectTrigger>
                <SelectContent>
                  {requests.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Resources</CardTitle></CardHeader>
            <CardContent>
              <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                <SelectTrigger><SelectValue placeholder="Select a Resource Type" /></SelectTrigger>
                <SelectContent>
                  {resourceGroups.map(({ type, count }) => (
                    <SelectItem key={type} value={type}>{`${type} (${count})`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* ── Map ── */}
        <div className="md:col-span-3">
          <Card className="h-[65vh] md:h-[75vh]">
            <CardContent className="p-0 h-full">
              <MapView
                disasters={disasters}
                requests={requests}
                resources={resources}
                selectedDisasterId={selectedDisasterId}
                selectedRequestId={selectedRequestId}
                selectedResourceType={selectedResourceType}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

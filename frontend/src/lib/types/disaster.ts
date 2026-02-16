// lib/types/disaster.ts

export type DisasterSeverity = 'High' | 'Medium' | 'Low';
export type DisasterStatus = 'Registered' | 'Pending' | 'Rejected';

export type DisasterLocation = {
  latitude: number;
  longitude: number;
  address?: string;
};

export type Disaster = {
  id: string;
  name: string;
  description: string;
  severity: DisasterSeverity;
  type: string;
  location: DisasterLocation;
  createdAt: string;
  status: DisasterStatus;
  imageUrl?: string;
};

export type JoinedResponse = {
  joined: boolean;
  role?: 'volunteer' | 'first_responder' | 'affected_individual';
};

// API response structures
export type DisasterApiLocation = {
  lat: number;
  lng: number;
  address?: string | null;
};

export type DisasterApiResponse = {
  id: string;
  name: string;
  description: string;
  severity?: string | null;
  type?: string | null;
  location?: DisasterApiLocation | null;
  created_at?: string | null;
  status?: string | null;
  image_urls?: string[] | null;
};

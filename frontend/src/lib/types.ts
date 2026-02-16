// export interface ApiError {
//   message: string;
//   status?: number;
//   data?: unknown;
// }

import { User } from "./types/user";

// export type Role = "admin" | "responder" | "volunteer" | "individual";

// export interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: Role;
//   avatar: string;
// }

// export type TaskStatus = "Pending" | "Approved" | "Assigned" | "In Progress" | "Completed" | "Rejected";
// export type TaskPriority = "High" | "Medium" | "Low";

// export interface Task {
//   id: string;
//   disasterId: string;
//   title: string;
//   description: string;
//   priority: TaskPriority;
//   status: TaskStatus;
//   requester?: User;
//   assignedTo?: User;
//   location: {
//     lat: number;
//     lng: number;
//     address: string;
//   };
//   createdAt: string;
// }

// // Resource Categories
// export type ResourceCategory = "Vehicles" | "Food" | "Medicine" | "Clothing" | "Shelter" | "Rescue & Tools" | "Other";
// // Subcategories per category
// export type ResourceSubcategory =
//   | "Two wheel vehicle"
//   | "Threewheel vehicle"
//   | "Four wheel vehicle"
//   | "Boat"
//   | "Dry Rations"
//   | "Cooked meals"
//   | "Bottled Water"
//   | "First aid kits"
//   | "Medical supplies"
//   | "Stretchers"
//   | "Women’s Pack"
//   | "Men’s Pack"
//   | "Tents"
//   | "Tarpaulins"
//   | "Rescue kits"
//   | "Radio Sets"
//   | "Tools"
//   | "Other";
// export type ResourceStatus = "Available" | "In Use" | "Under Maintenance";

// export type ResourceDonation = {
//   id: string;
//   category: ResourceCategory;
//   subcategory: ResourceSubcategory;
//   quantity: number;
//   unit: string;
//   location: string; // pickup point
//   status: ResourceStatus;
//   notes?: string;
//   createdAt: string;
//   donatedBy: User;
//   updatedAt: string;
//   lastUpdated: string; // human-readable date
//   total: number; // total quantity donated (for availability calculation)
// };

// export interface Resource {
//   id: string;
//   name: string;
//   type: ResourceCategory;
//   status: ResourceStatus;
//   quantity: number;
//   unit?: string;            // e.g., "kits", "bottles", "kg"
//   location?: GeoLocation;
//   assignedTo?: string; // User ID
//   createdAt: Date;
//   updatedAt: Date;
// }

// export type FieldReportSeverity = "Critical" | "High" | "Medium" | "Low";
// export type FieldReportObservationType = "Damage Assessment" | "Blocked Road" | "Medical Need" | "Shelter Need" | "Resource Request" | "Volunteer Availability" | "Other";

// export interface FieldReport {
//   id: string;
//   disaster: string;                  
//   observationType: FieldReportObservationType;
//   severity: FieldReportSeverity;     
//   title: string;                  
//   details: string;                   
//   location: GeoLocation;
//   photos?: File[] | string[];        // File on client; string[] after upload
//   voiceNote?: File | string | null;  // File on client; string after upload
//   reporter?: User;                   // volunteer user
//   createdAt: string;
// }

// // What the form will submit (server adds id/reporter/createdAt)
// export type FieldReportCreate = Omit<
//   FieldReport,
//   "id" | "reporter" | "createdAt" | "photos" | "voiceNote"
// > & {
//   photos: File[];
//   voiceNote: File | null;
// };

// export type DisasterStatus = "Registered" | "Pending" | "Rejected";
// export const DISASTER_STATUS_OPTIONS: (DisasterStatus | "All")[] = [
//   "All",
//   "Registered",
//   "Pending",
//   "Rejected",
// ];
// export type DisasterSeverity = "High" | "Medium" | "Low";
// export const DISASTER_SEVERITY_OPTIONS: (DisasterSeverity | "All")[] = [
//   "All",
//   "High",
//   "Medium",
//   "Low",
// ];

// export type Disaster = {
//   id: string;
//   name: string; // e.g., "Flood in Colombo"
//   description: string;
//   severity: DisasterSeverity;
//   type: string; // e.g., "Flood", "Landslide"
//   location: GeoLocation;
//   createdAt: string;
//   status: DisasterStatus;
//   suggestedByAI?: boolean;
//   imageUrl?: string;
// };

// // Location Type
// export interface GeoLocation {
//   latitude: number;
//   longitude: number;
//   address?: string;
// }

// export interface HelpRequest {
//   id: string;
//   disaster?: string; // Optional disaster association
//   requester: User; // The user who made the request
//   title: string;
//   description: string;
//   location: GeoLocation;
//   status: TaskStatus; // Pending, Approved, etc.
//   priority: TaskPriority; // High, Medium, Low
//   resourcesNeeded: ResourceSubcategory[]; // Types of resources requested
//   createdAt: string;
// }

// // What the form will submit (server adds id/requester/createdAt)
// export type HelpRequestCreate = Omit<
//   HelpRequest,
//   "id" | "requester" | "createdAt"
// > & {
//   disaster: string;
//   title: string;
//   details: string;
//   location: {
//     lat: number;
//     lng: number;
//     address: string;
//   };
//   photos: File[];
//   voiceNote: File | null;
// };

export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "Pending" | "Approved" | "Assigned" | "In Progress" | "Completed" | "Rejected"

export type GeoLocation = {
  lat?: number;
  lng?: number;
  address?: string;
};

// lib/types.ts
export type RequirementResource = {
  resourceId?: string; // backend resource identifier (if persisted)
  type: string;        // e.g., "medikit", "water bottle 1 litre"
  quantity: number;    // numeric for glance + editing
  unit?: string;       // optional (kept if you want "pcs", "kits", etc.)
};

export type Requirements = {
  manpower?: {
    total_volunteers: number;
    notes?: string; // keep if you still want it
  };
  resources?: RequirementResource[];
};

export type HelpRequest = {
  id: string;
  title: string;           // e.g., “Household assistance request”
  disasterId: string;      // ties to mockDisasters
  location?: GeoLocation;
};

export type Task = {
  id: string;
  requestId: string;       // NEW: which help request this task belongs to
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  requester?: User;
  assignedTo?: User;
  disasterId?: string;
  location?: GeoLocation;
  requirements?: Requirements;
  createdAt?: string;
  updatedAt?: string;
};

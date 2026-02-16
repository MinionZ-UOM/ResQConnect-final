import type { User, Task, HelpRequest, Role, Disaster, ResourceDonation, ResourceCategory, ResourceSubcategory } from "./types";

export const mockVolunteers: User[] = [
  {
    id: 'user-volunteer-1',
    name: "Volunteer One",
    email: "volunteer1@resqconnect.com",
    role: "volunteer",
    avatar: "https://i.pravatar.cc/150?u=volunteer1"
  },
  {
    id: 'user-volunteer-2',
    name: "Volunteer Two",
    email: "volunteer2@resqconnect.com",
    role: "volunteer",
    avatar: "https://i.pravatar.cc/150?u=volunteer2"
  },
  {
    id: 'user-volunteer-3',
    name: "Volunteer Three",
    email: "volunteer3@resqconnect.com",
    role: "volunteer",
    avatar: "https://i.pravatar.cc/150?u=volunteer3"
  },
];

export const mockUsers: Record<Role, User> = {
  admin: {
    id: 'user-admin-1',
    name: 'Admin User',
    email: 'admin@resqconnect.com',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?u=admin'
  },
  responder: {
    id: 'user-responder-1',
    name: 'First Responder',
    email: 'responder@resqconnect.com',
    role: 'responder',
    avatar: 'https://i.pravatar.cc/150?u=responder'
  },
  volunteer: mockVolunteers[0], // Use the first mock volunteer
  individual: {
    id: 'user-individual-1',
    name: 'Affected Individual',
    email: 'individual@resqconnect.com',
    role: 'individual',
    avatar: 'https://i.pravatar.cc/150?u=individual'
  }
};

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    disasterId: 'Flood',
    title: 'Urgent Medical Assistance Needed',
    description: 'An elderly person is trapped on the second floor of a flooded house and requires immediate medical attention for a respiratory condition.',
    priority: 'High',
    status: 'Pending',
    requester: mockUsers.individual,
    location: { lat: 6.9271, lng: 79.8612, address: '123 Galle Road, Colombo' },
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-2',
    disasterId: 'Landslide',
    title: 'Food and Water Supply Request',
    description: 'A family of 5 is stranded without access to clean water or food supplies.',
    priority: 'Medium',
    status: 'Approved',
    requester: mockUsers.individual,
    location: { lat: 6.8659, lng: 79.8824, address: '456 High Level Road, Nugegoda' },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-3',
    disasterId: 'Landslide',
    title: 'Search and Rescue for Missing Person',
    description: 'A child has been reported missing after a landslide in the area. Last seen near the river bank.',
    priority: 'Low',
    status: 'Assigned',
    assignedTo: mockUsers.volunteer,
    location: { lat: 7.2906, lng: 80.6337, address: '789 Peradeniya Road, Kandy' },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-4',
    disasterId: 'Flood',
    title: 'Structural Damage Assessment',
    description: 'Assess the structural integrity of a bridge that was partially submerged during the flood.',
    priority: 'High',
    status: 'In Progress',
    assignedTo: mockUsers.volunteer,
    location: { lat: 6.0535, lng: 80.2210, address: 'Galle Fort Bridge, Galle' },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-5',
    disasterId: 'Landslide',
    title: 'Shelter Supplies Delivery',
    description: 'Deliver blankets and hygiene kits to the community shelter at the local school.',
    priority: 'Medium',
    status: 'Completed',
    assignedTo: mockUsers.volunteer,
    location: { lat: 5.9549, lng: 80.5556, address: 'Matara Central College, Matara' },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-6',
    disasterId: 'Flood',
    title: 'Request for Temporary Shelter',
    description: 'Our house is completely flooded, we need a safe place to stay for a family of 4.',
    priority: 'Low',
    status: 'Rejected',
    requester: mockUsers.individual,
    location: { lat: 6.9319, lng: 79.8478, address: 'Baseline Road, Colombo 9' },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-7',
    disasterId: 'Flood',
    title: 'Food and Water Supply Request',
    description: 'A family of 5 is stranded without access to clean water or food supplies.',
    priority: 'High',
    status: 'Approved',
    requester: mockUsers.individual,
    location: { lat: 6.8659, lng: 79.8824, address: '456 High Level Road, Nugegoda' },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockDisasters: Disaster[] = [
  {
    id: "d1",
    name: "Flood in Colombo",
    description: "Heavy rainfall has caused flash floods in low-lying areas, leaving several households submerged and roads impassable.",
    severity: "High",
    type: "Flood",
    location: {
      latitude: 6.9271,
      longitude: 79.8612,
      address: "123 Galle Road, Colombo",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
    status: "Registered",
    imageUrl: "/images/disasters/flood-colombo.jpg",
  },
  {
    id: "d2",
    name: "Landslide in Kandy",
    description: "A hillside collapse has blocked roads and damaged houses in the Peradeniya area. Several families have been evacuated.",
    severity: "High",
    type: "Landslide",
    location: {
      latitude: 7.2906,
      longitude: 80.6337,
      address: "789 Peradeniya Road, Kandy",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: "Registered",
    suggestedByAI: true,
    imageUrl: "/images/disasters/landslide-kandy.jpeg",
  },
  {
    id: "d3",
    name: "Flood in Galle",
    description: "Monsoon rains have triggered severe flooding in coastal villages, disrupting transportation and leaving many stranded.",
    severity: "Medium",
    type: "Flood",
    location: {
      latitude: 6.0535,
      longitude: 80.221,
      address: "45 Sea Street, Galle",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: "Registered",
    imageUrl: "/images/disasters/flood-galle.jpg",
  },
  {
    id: "d4",
    name: "Landslide in Nuwara Eliya",
    description: "Continuous rainfall has led to a major landslide damaging tea plantations and cutting off access to nearby villages.",
    severity: "High",
    type: "Landslide",
    location: {
      latitude: 6.9497,
      longitude: 80.7891,
      address: "Lake Gregory Road, Nuwara Eliya",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: "Rejected",
    imageUrl: "/images/disasters/landslide-nuwaraeliya.jpg",
  },
  {
    id: "d5",
    name: "Flood in Ratnapura",
    description: "Overflowing rivers have caused widespread flooding, displacing families and threatening gem mining areas nearby.",
    severity: "High",
    type: "Flood",
    location: {
      latitude: 6.6828,
      longitude: 80.399,
      address: "Main Street, Ratnapura",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: "Pending",
    imageUrl: "/images/disasters/flood-ratnapura.jpg",
  },
  {
    id: "d6",
    name: "Landslide in Badulla",
    description: "A sudden slope failure has buried several homes in the village, with ongoing search and rescue operations in progress.",
    severity: "High",
    type: "Landslide",
    location: {
      latitude: 6.9934,
      longitude: 81.055,
      address: "Ella–Wellawaya Road, Badulla",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: "Registered",
    imageUrl: "/images/disasters/landslide-badulla.jpg",
  },
];

export const mockHelpRequests: HelpRequest[] = [
  {
    id: "r-2005",
    disasterId: "d1", // Flood in Colombo
    requester: mockUsers.individual,
    title: "Family trapped in flooded house near Rajagiriya",
    description:
      "Floodwaters have entered our single-storey house, rising above knee level. We have two elderly members unable to move without assistance. Urgently need evacuation support and safe relocation.",
    location: {
      latitude: 6.9107,
      longitude: 79.8877,
      address: "Sri Jayawardenepura Mawatha, Rajagiriya, Colombo",
    },
    status: "Pending",
    priority: "High",
    resourcesNeeded: ["Boat", "First aid kits"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "r-2006",
    disasterId: "d2", // Landslide in Kandy
    requester: mockUsers.individual,
    title: "Families affected by landslide in Peradeniya",
    description:
      "A hillside collapse has blocked roads and damaged houses near Peradeniya Road. Several families are displaced and require medical checks, debris clearing support, and temporary shelter.",
    location: {
      latitude: 7.2906,
      longitude: 80.6337,
      address: "789 Peradeniya Road, Kandy",
    },
    status: "Pending",
    priority: "High",
    resourcesNeeded: ["Shovels", "Excavation tools", "Medical kits", "Blankets"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  }
];

// export function getMockHelpRequests(): HelpRequest[] {
//   return mockHelpRequests.map((r) => ({
//     ...r,
//     location: { ...r.location },
//     requester: { ...r.requester },
//   }));
// }

// export const mockVolunteerTasks: Task[] = [
//   {
//     id: "t-1001",
//     disasterId: "d1", // Flood in Colombo
//     title: "Evacuate elderly residents at Perera Mawatha",
//     description:
//       "Two non-ambulatory residents require evacuation from a single-storey house. Floodwater is knee-high inside and around the property, with the access lane partially blocked by debris. Bring stretcher/chair, blankets, and PPE; confirm safest approach route and a dry transfer point before moving the patients.",
//     priority: "High",
//     status: "Completed",
//     requester: mockUsers.individual,
//     assignedTo: mockUsers.volunteer,
//     location: { lat: 6.9107, lng: 79.8877, address: "Perera Mawatha, Rajagiriya" },
//     createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
//   },
//   /*
//   {
//     id: "t-1002",
//     disasterId: "d2", // Landslide in Kandy
//     title: "Deliver tarpaulins to displaced families near Gannoruwa",
//     description:
//       "Access road is muddy but passable with a pickup or 4x4. Twelve families need tarpaulins, ropes, mats, and hygiene kits. Set up a small distribution point on firm ground and coordinate handover with logistics to avoid repeat trips.",
//     priority: "High",
//     status: "In Progress",
//     requester: mockUsers.individual,
//     assignedTo: mockUsers.volunteer,
//     location: { lat: 7.2825, lng: 80.5980, address: "Gannoruwa, Kandy" },
//     createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
//   },
//   {
//     id: "t-1003",
//     disasterId: "d3", // Flood in Galle
//     title: "First-aid support at temporary shelter, Galle town hall",
//     description:
//       "Support on-site triage for minor injuries and direct serious cases to the medical officer. Establish a clean first-aid station, use PPE, and record assisted cases. Disinfectant stocks are low—request restock of antiseptic solution, wipes, gloves, and gauze.",
//     priority: "Medium",
//     status: "Completed",
//     requester: mockUsers.individual,
//     assignedTo: mockUsers.volunteer,
//     location: { lat: 6.0367, lng: 80.2170, address: "Town Hall, Galle" },
//     createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
//   },
//   */
//   {
//     id: "t-1004",
//     disasterId: "d1", // Flood in Colombo
//     title: "Clear blocked drain near Borella junction",
//     description:
//       "Perform light debris removal to improve water flow. Use shovels, rakes, and gloves; prioritize inlets/outlets first and place debris safely away. Escalate to the municipal team if heavy machinery is needed and document before/after conditions.",
//     priority: "Low",
//     status: "In Progress",
//     requester: mockUsers.individual,
//     assignedTo: mockUsers.volunteer,
//     location: { lat: 6.9147, lng: 79.8696, address: "Borella Junction, Colombo 8" },
//     createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
//   },
//   /*
//   {
//     id: "t-1005",
//     disasterId: "d3", // Flood in Galle
//     title: "Inspect damaged bridge at Wakwella Road",
//     description:
//       "Reports indicate cracks on bridge pillars after flooding. Conduct a quick structural inspection and restrict vehicle access until municipal engineers arrive. Place warning signs and reroute traffic through the alternative bridge nearby.",
//     priority: "High",
//     status: "In Progress",
//     requester: mockUsers.individual,
//     assignedTo: mockUsers.volunteer,
//     location: { lat: 6.0535, lng: 80.2108, address: "Wakwella Road, Galle" },
//     createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
//   },
//   {
//     id: "t-1007",
//     disasterId: "d2", // Landslide in Kandy
//     title: "Assist road clearance at Peradeniya hillside",
//     description:
//       "A section of the hillside collapsed, leaving debris on the road and blocking access for relief vehicles. Volunteers are needed to help clear fallen branches and support NBRO staff in assessing slope stability.",
//     priority: "Low",
//     status: "Rejected",
//     requester: mockUsers.individual,
//     assignedTo: mockUsers.volunteer,
//     location: { lat: 7.2716, lng: 80.5950, address: "Peradeniya hillside, Kandy" },
//     createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
//   },
//   */
//   {
//     id: "t-1008",
//     disasterId: "d1",
//     title: "Evacuate trapped family from Rajagiriya house",
//     description:
//       "Two elderly members require evacuation from a flooded single-storey house. Bring stretcher/chair and PPE. Confirm safest route and transfer point at Rajagiriya Community Hall.",
//     priority: "High",
//     status: "Pending",
//     requester: mockUsers.individual,
//     assignedTo: mockUsers.volunteer, // waiting assignment
//     location: { lat: 6.9107, lng: 79.8877, address: "Sri Jayawardenepura Mawatha, Rajagiriya" },
//     createdAt: new Date().toISOString(),
//   },
//   {
//     id: "t-1009",
//     disasterId: "d1",
//     title: "Set up temporary shelter at Rajagiriya Community Hall",
//     description:
//       "Prepare mats, blankets, and safe drinking water for displaced families. Register evacuees and ensure mosquito nets are installed.",
//     priority: "Medium",
//     status: "Pending",
//     requester: mockUsers.individual,
//     assignedTo: mockUsers.volunteer,
//     location: { lat: 6.9130, lng: 79.8900, address: "Rajagiriya Community Hall, Colombo" },
//     createdAt: new Date().toISOString(),
//   },
//   {
//     id: "t-1010",
//     disasterId: "d1",
//     title: "Evacuate trapped family from Rajagiriya house",
//     description:
//       "Two elderly members require evacuation from a flooded single-storey house. Bring stretcher/chair and PPE. Confirm safest route and transfer point at Rajagiriya Community Hall.",
//     priority: "High",
//     status: "Approved",
//     requester: mockUsers.individual,
//     assignedTo: mockUsers.volunteer, // waiting assignment
//     location: { lat: 6.9107, lng: 79.8877, address: "Sri Jayawardenepura Mawatha, Rajagiriya" },
//     createdAt: new Date().toISOString(),
//   },
//   {
//     id: "t-1011",
//     disasterId: "d1",
//     title: "Set up temporary shelter at Rajagiriya Community Hall",
//     description:
//       "Prepare mats, blankets, and safe drinking water for displaced families. Register evacuees and ensure mosquito nets are installed.",
//     priority: "Medium",
//     status: "Approved",
//     requester: mockUsers.individual,
//     assignedTo: mockUsers.volunteer,
//     location: { lat: 6.9130, lng: 79.8900, address: "Rajagiriya Community Hall, Colombo" },
//     createdAt: new Date().toISOString(),
//   },
// ];

// export function getMockVolunteerTasks(): Task[] {
//   // Return a shallow clone so local edits don’t mutate the source
//   return mockVolunteerTasks.map(t => ({ ...t, location: { ...t.location }, assignedTo: t.assignedTo && { ...t.assignedTo } }));
// }

// lib/mock-data.ts

export const mockVolunteerTasks: Task[] = [
  // ==== d1: Flood in Colombo (r-2005) ====
  {
    id: "Task1",
    requestId: "r-2005",
    description:
      "Deploy a team to deliver essential medical supplies to an affected household in Colombo (Galle Road). Use a rescue kit to navigate waterlogged streets. Outcome: immediate medical assistance to the sick individual.",
    priority: "High",
    status: "Pending",
    disasterId: "d1",
    requester: mockUsers.individual,
    location: { lat: 6.9271, lng: 79.8612, address: "123 Galle Road, Colombo" },
    requirements: {
      manpower: { total_volunteers: 4 },
      resources: [{ type: "medikit", quantity: 1 }],
    },
  },
  {
    id: "Task2",
    requestId: "r-2005",
    description:
      "Organize a water distribution effort for households affected by flooding near Galle Road, Colombo. Use sealed 1L bottles to ensure safe transport. Outcome: prevent dehydration and ensure access to clean water.",
    priority: "Medium",
    status: "Pending",
    disasterId: "d1",
    requester: mockUsers.individual,
    location: { lat: 6.9271, lng: 79.8612, address: "123 Galle Road, Colombo" },
    requirements: {
      manpower: { total_volunteers: 2 },
      resources: [{ type: "water bottle 1 litre", quantity: 12 }],
    },
  },
  {
    id: "Task3",
    requestId: "r-2005",
    description:
      "Erect a temporary shelter for a family whose home is uninhabitable due to flooding in Colombo. Use a standard shelter kit. Outcome: provide safe, dry living space.",
    priority: "Medium",
    status: "Pending",
    disasterId: "d1",
    requester: mockUsers.individual,
    location: { lat: 6.9271, lng: 79.8612, address: "123 Galle Road, Colombo" },
    requirements: {
      manpower: { total_volunteers: 1 },
      resources: [{ type: "shelter kit", quantity: 1 }],
    },
  },
  {
    id: "Task4",
    requestId: "r-2005",
    description:
      "Coordinate with local health workers in Colombo for an on-site consultation. Ensure a volunteer accompanies them for access and communication. Outcome: timely medical attention to the patient.",
    priority: "High",
    status: "Pending",
    disasterId: "d1",
    requester: mockUsers.individual,
    location: { lat: 6.9271, lng: 79.8612, address: "123 Galle Road, Colombo" },
    requirements: {
      manpower: { total_volunteers: 1 },
      resources: [],
    },
  },

  // ==== d2: Landslide in Kandy (r-2006) ====
  {
    id: "Task5",
    requestId: "r-2006",
    description:
      "Coordinate with local health workers to reach families impacted by the landslide in Peradeniya, Kandy. A volunteer should accompany for navigation and communication.",
    priority: "High",
    status: "Pending",
    disasterId: "d2",
    requester: mockUsers.individual,
    location: { lat: 7.2906, lng: 80.6337, address: "789 Peradeniya Road, Kandy" },
    requirements: { manpower: { total_volunteers: 1 }, resources: [] },
  },
  {
    id: "Task6",
    requestId: "r-2006",
    description:
      "Schedule on-site medical review for evacuated residents near Peradeniya Road. Ensure safe access around blocked routes.",
    priority: "High",
    status: "Approved",
    disasterId: "d2",
    requester: mockUsers.individual,
    location: { lat: 7.2906, lng: 80.6337, address: "789 Peradeniya Road, Kandy" },
    requirements: { manpower: { total_volunteers: 1 }, resources: [] },
  },
  {
    id: "Task7",
    requestId: "r-2006",
    description:
      "Deploy assigned volunteer to accompany the health worker to affected homes in Peradeniya, Kandy.",
    priority: "High",
    status: "Assigned",
    disasterId: "d2",
    requester: mockUsers.individual,
    assignedTo: mockUsers.volunteer,
    location: { lat: 7.2906, lng: 80.6337, address: "789 Peradeniya Road, Kandy" },
    requirements: { manpower: { total_volunteers: 1 }, resources: [] },
  },
];

export function getMockVolunteerTasks(): Task[] {
  return mockVolunteerTasks;
}

export function getMockHelpRequests(): HelpRequest[] {
  return mockHelpRequests;
}

export const allUsers: User[] = Object.values(mockUsers).concat([
  { id: 'user-2', name: 'Jane Doe', email: 'jane@example.com', role: 'volunteer', avatar: 'https://i.pravatar.cc/150?u=jane' },
  { id: 'user-3', name: 'John Smith', email: 'john@example.com', role: 'responder', avatar: 'https://i.pravatar.cc/150?u=john' },
  { id: 'user-4', name: 'Peter Jones', email: 'peter@example.com', role: 'individual', avatar: 'https://i.pravatar.cc/150?u=peter' },
]);

// Categories with subcategories
export const RESOURCE_CATEGORIES: Record<ResourceCategory, ResourceSubcategory[]> = {
  Vehicles: ["Two wheel vehicle", "Threewheel vehicle", "Four wheel vehicle", "Boat"],
  Food: ["Dry Rations", "Cooked meals", "Bottled Water"],
  Medicine: ["First aid kits", "Medical supplies", "Stretchers"],
  Clothing: ["Women’s Pack", "Men’s Pack"],
  Shelter: ["Tents", "Tarpaulins"],
  "Rescue & Tools": ["Rescue kits", "Radio Sets", "Tools"],
  Other: ["Other"],
};

// Pickup points
export const PICKUP_POINTS = [
  "Colombo Depot",
  "Kandy Centre",
  "Galle Hub",
  "Jaffna Hub",
  "Badulla Centre",
];

// Mock resources
export const getMockResources = (): ResourceDonation[] => [
  {
    id: "r-1001",
    category: "Vehicles",
    subcategory: "Boat",
    quantity: 2,
    unit: "units",
    location: "Colombo Depot",
    status: "Available",
    notes: "One requires repair",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
    donatedBy: mockUsers.responder,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    lastUpdated: '2 hours ago',
    total: 5,
  },
  {
    id: "r-1002",
    category: "Food",
    subcategory: "Dry Rations",
    quantity: 100,
    unit: "packs",
    location: "Galle Hub",
    status: "Available",
    notes: "Rice, dhal, canned fish",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    donatedBy: mockUsers.volunteer,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h ago
    lastUpdated: '3 hours ago',
    total: 150,
  },
  {
    id: "r-1003",
    category: "Food",
    subcategory: "Bottled Water",
    quantity: 200,
    unit: "bottles",
    location: "Jaffna Hub",
    status: "Available",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5h ago
    donatedBy: mockUsers.responder,
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
    lastUpdated: '30 minutes ago',
    total: 300,
  },
  {
    id: "r-1004",
    category: "Medicine",
    subcategory: "First aid kits",
    quantity: 20,
    unit: "kits",
    location: "Badulla Centre",
    status: "Available",
    notes: "Includes bandages, antiseptic",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    donatedBy: mockUsers.volunteer,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1h ago
    lastUpdated: '1 hour ago',
    total: 25,
  },
  {
    id: "r-1005",
    category: "Clothing",
    subcategory: "Women’s Pack",
    quantity: 50,
    unit: "packs",
    location: "Colombo Depot",
    status: "Available",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    donatedBy: mockUsers.volunteer,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    lastUpdated: '2 hours ago',
    total: 60,
  },
  {
    id: "r-1006",
    category: "Shelter",
    subcategory: "Tents",
    quantity: 10,
    unit: "tents",
    location: "Kandy Centre",
    status: "Available",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    donatedBy: mockUsers.volunteer,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h ago
    lastUpdated: '4 hours ago',
    total: 15,
  },
  {
    id: "r-1007",
    category: "Rescue & Tools",
    subcategory: "Rescue kits",
    quantity: 15,
    unit: "kits",
    location: "Galle Hub",
    status: "Available",
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    donatedBy: mockUsers.volunteer,
    updatedAt: new Date(Date.now() - 1000 * 60 * 100).toISOString(), // 100m ago
    lastUpdated: '100 minutes ago',
    total: 20,
  },
];

// AdminChartResources
export const AdminChartResources = [
  { name: 'Medi Kits', quantity: 10 },
  { name: 'Boats', quantity: 3 },
  { name: 'Cloth Packs', quantity: 12 },
  { name: 'Rescue Kits', quantity: 5 },
];
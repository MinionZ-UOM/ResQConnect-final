// =============================================================================
// ResQConnect — Resource Distribution Simulation Mock Data
// Sri Lanka flood / landslide response demo dataset
// =============================================================================

// ─── Resource Types ──────────────────────────────────────────────────────────

export type Commodity = {
    code: string;
    name: string;
    unit: string;
    unit_weight_kg: number;
    unit_volume_m3: number;
    priority_for_life_safety: number;
};

export const COMMODITIES: Commodity[] = [
    { code: "DRY_RATION", name: "Dry Ration Pack", unit: "pack", unit_weight_kg: 5.0, unit_volume_m3: 0.018, priority_for_life_safety: 0.85 },
    { code: "WATER_5L", name: "Drinking Water 5L", unit: "container", unit_weight_kg: 5.2, unit_volume_m3: 0.006, priority_for_life_safety: 0.95 },
    { code: "MED_KIT", name: "Medical Kit", unit: "kit", unit_weight_kg: 2.0, unit_volume_m3: 0.010, priority_for_life_safety: 1.00 },
    { code: "HYGIENE_KIT", name: "Hygiene Kit", unit: "kit", unit_weight_kg: 1.5, unit_volume_m3: 0.008, priority_for_life_safety: 0.70 },
    { code: "TARPAULIN", name: "Tarpaulin Sheet", unit: "sheet", unit_weight_kg: 3.0, unit_volume_m3: 0.012, priority_for_life_safety: 0.75 },
    { code: "BLANKET", name: "Blanket", unit: "item", unit_weight_kg: 1.2, unit_volume_m3: 0.009, priority_for_life_safety: 0.55 },
];

// ─── Priority Classes ────────────────────────────────────────────────────────

export type PriorityClass = { label: string; weight: number; description: string };

export const PRIORITY_CLASSES: PriorityClass[] = [
    { label: "HIGH", weight: 5, description: "Injury, trapped people, infants, elderly, disabled, landslide risk, no safe shelter" },
    { label: "MEDIUM", weight: 3, description: "Food/water shortage, road blocked, temporary shelter issues, moderate vulnerability" },
    { label: "LOW", weight: 1, description: "Non-critical replenishment, information check, delayed household support" },
];

// ─── Depots ──────────────────────────────────────────────────────────────────

export type Depot = {
    depot_id: string;
    name: string;
    district: string;
    lat: number;
    lng: number;
    type: string;
    inventory: Record<string, number>;
};

export const DEPOTS: Depot[] = [
    {
        depot_id: "D1", name: "Colombo Regional Logistics Hub", district: "Colombo",
        lat: 6.9271, lng: 79.8612, type: "regional_warehouse",
        inventory: { DRY_RATION: 1800, WATER_5L: 2600, MED_KIT: 240, HYGIENE_KIT: 700, TARPAULIN: 420, BLANKET: 950 },
    },
    {
        depot_id: "D2", name: "Ratnapura District Relief Centre", district: "Ratnapura",
        lat: 6.6828, lng: 80.3992, type: "district_store",
        inventory: { DRY_RATION: 900, WATER_5L: 1400, MED_KIT: 130, HYGIENE_KIT: 420, TARPAULIN: 260, BLANKET: 500 },
    },
    {
        depot_id: "D3", name: "Kegalle Emergency Supply Point", district: "Kegalle",
        lat: 7.2513, lng: 80.3464, type: "district_store",
        inventory: { DRY_RATION: 750, WATER_5L: 1200, MED_KIT: 110, HYGIENE_KIT: 350, TARPAULIN: 180, BLANKET: 420 },
    },
];

// ─── Fleet ───────────────────────────────────────────────────────────────────

export type Vehicle = {
    vehicle_id: string;
    type: string;
    home_depot: string;
    capacity_kg: number;
    capacity_m3: number;
    avg_speed_kmph_clear: number;
    avg_speed_kmph_disrupted: number;
    status: string;
    current_load_utilization: number;
    driver: string;
};

export const VEHICLES: Vehicle[] = [
    { vehicle_id: "V1", type: "6T_LORRY", home_depot: "D1", capacity_kg: 6000, capacity_m3: 22.0, avg_speed_kmph_clear: 38, avg_speed_kmph_disrupted: 24, status: "EN_ROUTE", current_load_utilization: 0.68, driver: "Team Colombo-1" },
    { vehicle_id: "V2", type: "6T_LORRY", home_depot: "D2", capacity_kg: 6000, capacity_m3: 22.0, avg_speed_kmph_clear: 34, avg_speed_kmph_disrupted: 20, status: "AVAILABLE", current_load_utilization: 0.00, driver: "Team Ratnapura-1" },
    { vehicle_id: "V3", type: "3T_TRUCK", home_depot: "D2", capacity_kg: 3000, capacity_m3: 12.0, avg_speed_kmph_clear: 35, avg_speed_kmph_disrupted: 22, status: "EN_ROUTE", current_load_utilization: 0.54, driver: "Team Ratnapura-2" },
    { vehicle_id: "V4", type: "3T_TRUCK", home_depot: "D3", capacity_kg: 3000, capacity_m3: 12.0, avg_speed_kmph_clear: 35, avg_speed_kmph_disrupted: 21, status: "AVAILABLE", current_load_utilization: 0.00, driver: "Team Kegalle-1" },
    { vehicle_id: "V5", type: "4X4_PICKUP", home_depot: "D2", capacity_kg: 1200, capacity_m3: 4.2, avg_speed_kmph_clear: 42, avg_speed_kmph_disrupted: 28, status: "AVAILABLE", current_load_utilization: 0.00, driver: "Rapid Unit-1" },
    { vehicle_id: "V6", type: "4X4_PICKUP", home_depot: "D3", capacity_kg: 1200, capacity_m3: 4.2, avg_speed_kmph_clear: 41, avg_speed_kmph_disrupted: 27, status: "EN_ROUTE", current_load_utilization: 0.61, driver: "Rapid Unit-2" },
    { vehicle_id: "V7", type: "VAN_MEDICAL", home_depot: "D1", capacity_kg: 900, capacity_m3: 3.6, avg_speed_kmph_clear: 45, avg_speed_kmph_disrupted: 30, status: "AVAILABLE", current_load_utilization: 0.00, driver: "Medical Dispatch-1" },
    { vehicle_id: "V8", type: "TRACTOR_TRAILER", home_depot: "D2", capacity_kg: 1800, capacity_m3: 6.5, avg_speed_kmph_clear: 24, avg_speed_kmph_disrupted: 16, status: "AVAILABLE", current_load_utilization: 0.00, driver: "Local Access Unit" },
];

// ─── Incident Requests ───────────────────────────────────────────────────────

export type IncidentRequest = {
    request_id: string;
    location_name: string;
    district: string;
    hazard_type: string;
    priority: string;
    priority_weight: number;
    people_affected: number;
    special_notes: string;
    demand: Record<string, number>;
    service_window_start_min: number;
    service_window_end_min: number;
    status: string;
};

export const REQUESTS: IncidentRequest[] = [
    { request_id: "R001", location_name: "Elapatha GN Division", district: "Ratnapura", hazard_type: "FLOOD", priority: "HIGH", priority_weight: 5, people_affected: 42, special_notes: "3 elderly, 1 pregnant woman, access road partially flooded", demand: { DRY_RATION: 25, WATER_5L: 60, MED_KIT: 3, HYGIENE_KIT: 10, TARPAULIN: 6, BLANKET: 20 }, service_window_start_min: 20, service_window_end_min: 95, status: "UNSERVED" },
    { request_id: "R002", location_name: "Ayagama School Shelter", district: "Ratnapura", hazard_type: "FLOOD", priority: "MEDIUM", priority_weight: 3, people_affected: 87, special_notes: "temporary shelter needs replenishment", demand: { DRY_RATION: 40, WATER_5L: 100, MED_KIT: 2, HYGIENE_KIT: 18, TARPAULIN: 0, BLANKET: 30 }, service_window_start_min: 35, service_window_end_min: 150, status: "ASSIGNED" },
    { request_id: "R003", location_name: "Bulathkohupitiya", district: "Kegalle", hazard_type: "LANDSLIDE", priority: "HIGH", priority_weight: 5, people_affected: 18, special_notes: "cut slope failure nearby, family isolated, 2 injured", demand: { DRY_RATION: 12, WATER_5L: 30, MED_KIT: 4, HYGIENE_KIT: 4, TARPAULIN: 5, BLANKET: 12 }, service_window_start_min: 10, service_window_end_min: 75, status: "UNSERVED" },
    { request_id: "R004", location_name: "Yatiyanthota Town Fringe", district: "Kegalle", hazard_type: "FLOOD", priority: "MEDIUM", priority_weight: 3, people_affected: 54, special_notes: "bridge traffic bottleneck, limited clean water", demand: { DRY_RATION: 28, WATER_5L: 70, MED_KIT: 2, HYGIENE_KIT: 12, TARPAULIN: 4, BLANKET: 18 }, service_window_start_min: 45, service_window_end_min: 180, status: "ASSIGNED" },
    { request_id: "R005", location_name: "Matugama Rural Cluster", district: "Kalutara", hazard_type: "FLOOD", priority: "HIGH", priority_weight: 5, people_affected: 65, special_notes: "school shelter overflow, infants present", demand: { DRY_RATION: 35, WATER_5L: 85, MED_KIT: 3, HYGIENE_KIT: 16, TARPAULIN: 8, BLANKET: 28 }, service_window_start_min: 25, service_window_end_min: 110, status: "UNSERVED" },
    { request_id: "R006", location_name: "Kalawana Estate Line Rooms", district: "Ratnapura", hazard_type: "LANDSLIDE", priority: "HIGH", priority_weight: 5, people_affected: 29, special_notes: "line room damage, slope instability, urgent shelter support", demand: { DRY_RATION: 15, WATER_5L: 36, MED_KIT: 2, HYGIENE_KIT: 8, TARPAULIN: 10, BLANKET: 24 }, service_window_start_min: 15, service_window_end_min: 85, status: "UNSERVED" },
    { request_id: "R007", location_name: "Ruwanwella Shelter Centre", district: "Kegalle", hazard_type: "FLOOD", priority: "LOW", priority_weight: 1, people_affected: 110, special_notes: "non-urgent replenishment after first delivery", demand: { DRY_RATION: 22, WATER_5L: 40, MED_KIT: 1, HYGIENE_KIT: 10, TARPAULIN: 0, BLANKET: 15 }, service_window_start_min: 90, service_window_end_min: 220, status: "UNSERVED" },
    { request_id: "R008", location_name: "Beruwala Temporary Camp", district: "Kalutara", hazard_type: "FLOOD", priority: "MEDIUM", priority_weight: 3, people_affected: 72, special_notes: "high humidity, sanitation issue", demand: { DRY_RATION: 30, WATER_5L: 75, MED_KIT: 2, HYGIENE_KIT: 20, TARPAULIN: 2, BLANKET: 10 }, service_window_start_min: 60, service_window_end_min: 200, status: "UNSERVED" },
];

// ─── Travel Times ────────────────────────────────────────────────────────────

export type TravelTime = { from: string; to: string; travel_time_min: number };

export const TRAVEL_TIMES: TravelTime[] = [
    { from: "D1", to: "R005", travel_time_min: 78 }, { from: "D1", to: "R008", travel_time_min: 64 },
    { from: "D1", to: "R001", travel_time_min: 122 }, { from: "D1", to: "R002", travel_time_min: 135 },
    { from: "D1", to: "R003", travel_time_min: 146 }, { from: "D1", to: "R004", travel_time_min: 132 },
    { from: "D1", to: "R006", travel_time_min: 140 }, { from: "D1", to: "R007", travel_time_min: 118 },
    { from: "D2", to: "R001", travel_time_min: 28 }, { from: "D2", to: "R002", travel_time_min: 41 },
    { from: "D2", to: "R003", travel_time_min: 74 }, { from: "D2", to: "R004", travel_time_min: 81 },
    { from: "D2", to: "R005", travel_time_min: 96 }, { from: "D2", to: "R006", travel_time_min: 38 },
    { from: "D2", to: "R007", travel_time_min: 88 }, { from: "D2", to: "R008", travel_time_min: 104 },
    { from: "D3", to: "R001", travel_time_min: 82 }, { from: "D3", to: "R002", travel_time_min: 91 },
    { from: "D3", to: "R003", travel_time_min: 31 }, { from: "D3", to: "R004", travel_time_min: 24 },
    { from: "D3", to: "R005", travel_time_min: 118 }, { from: "D3", to: "R006", travel_time_min: 86 },
    { from: "D3", to: "R007", travel_time_min: 27 }, { from: "D3", to: "R008", travel_time_min: 126 },
];

// ─── Algorithm Config ────────────────────────────────────────────────────────

export const ALGORITHM_CONFIG = {
    planning_horizon_min: 240,
    priority_weights: { HIGH: 5, MEDIUM: 3, LOW: 1 },
    objective_parameters: { beta_unserved_penalty: 180, gamma_route_stability_penalty: 14 },
    aet_parameters: { w_urgency: 0.50, w_spatial: 0.30, w_slack: 0.20, theta_0: 0.72, alpha: 0.018, reopt_improvement_threshold_percent: 5 },
    business_rules: { atomic_fulfillment: true, split_delivery_allowed: false, max_reformulations: 2, local_insertion_enabled: true },
};

// ─── AET Events ──────────────────────────────────────────────────────────────

export type AETEvent = {
    event_id: string;
    time_min: number;
    new_request_id: string;
    phi_urgency: number;
    phi_spatial: number;
    phi_slack: number;
    disruption_score: number;
    adaptive_threshold: number;
    decision: string;
    reason: string;
};

export const AET_EVENTS: AETEvent[] = [
    { event_id: "EVT_101", time_min: 48, new_request_id: "R003", phi_urgency: 1.00, phi_spatial: 0.68, phi_slack: 0.61, disruption_score: 0.83, adaptive_threshold: 0.61, decision: "TRIGGER_REOPTIMIZATION", reason: "High urgency + moderate route deviation + low remaining slack" },
    { event_id: "EVT_102", time_min: 92, new_request_id: "R007", phi_urgency: 0.20, phi_spatial: 0.33, phi_slack: 0.40, disruption_score: 0.29, adaptive_threshold: 0.41, decision: "LOCAL_INSERTION_ONLY", reason: "Low urgency and manageable insertion cost" },
    { event_id: "EVT_103", time_min: 118, new_request_id: "R008", phi_urgency: 0.60, phi_spatial: 0.54, phi_slack: 0.57, disruption_score: 0.58, adaptive_threshold: 0.38, decision: "TRIGGER_REOPTIMIZATION", reason: "Threshold decayed and current routes are tight" },
];

// ─── Current Dispatch Plan ───────────────────────────────────────────────────

export type DispatchRoute = {
    vehicle_id: string;
    assigned_from_depot: string;
    route: string[];
    eta_sequence_min: number[];
    allocated_resources: Record<string, Record<string, number>>;
    load_utilization_after_dispatch: number;
    status: string;
};

export const CURRENT_PLAN: DispatchRoute[] = [
    {
        vehicle_id: "V2", assigned_from_depot: "D2",
        route: ["D2", "R001", "R006", "D2"],
        eta_sequence_min: [0, 28, 71, 109],
        allocated_resources: {
            R001: { DRY_RATION: 25, WATER_5L: 60, MED_KIT: 3, HYGIENE_KIT: 10, TARPAULIN: 6, BLANKET: 20 },
            R006: { DRY_RATION: 15, WATER_5L: 36, MED_KIT: 2, HYGIENE_KIT: 8, TARPAULIN: 10, BLANKET: 24 },
        },
        load_utilization_after_dispatch: 0.81, status: "DISPATCHED",
    },
    {
        vehicle_id: "V4", assigned_from_depot: "D3",
        route: ["D3", "R003", "R004", "D3"],
        eta_sequence_min: [0, 31, 58, 83],
        allocated_resources: {
            R003: { DRY_RATION: 12, WATER_5L: 30, MED_KIT: 4, HYGIENE_KIT: 4, TARPAULIN: 5, BLANKET: 12 },
            R004: { DRY_RATION: 28, WATER_5L: 70, MED_KIT: 2, HYGIENE_KIT: 12, TARPAULIN: 4, BLANKET: 18 },
        },
        load_utilization_after_dispatch: 0.89, status: "DISPATCHED",
    },
    {
        vehicle_id: "V1", assigned_from_depot: "D1",
        route: ["D1", "R005", "R008", "D1"],
        eta_sequence_min: [0, 78, 116, 180],
        allocated_resources: {
            R005: { DRY_RATION: 35, WATER_5L: 85, MED_KIT: 3, HYGIENE_KIT: 16, TARPAULIN: 8, BLANKET: 28 },
            R008: { DRY_RATION: 30, WATER_5L: 75, MED_KIT: 2, HYGIENE_KIT: 20, TARPAULIN: 2, BLANKET: 10 },
        },
        load_utilization_after_dispatch: 0.77, status: "DISPATCHED",
    },
];

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────

export const KPIS = {
    active_requests: 8,
    high_priority_requests: 4,
    available_vehicles: 5,
    vehicles_en_route: 3,
    depots_active: 3,
    total_people_affected: 477,
    fulfilled_requests: 2,
    assigned_requests: 2,
    unserved_requests: 4,
    average_eta_min: 63,
    solver_calls_today: 9,
    system_nervousness: 3,
    trigger_precision_percent: 66.7,
};

// ─── Status / Priority Colors ────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
    UNSERVED: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    ASSIGNED: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    IN_TRANSIT: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    FULFILLED: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    DEFERRED: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
    DISPATCHED: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
};

export const PRIORITY_COLORS: Record<string, string> = {
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    MEDIUM: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    LOW: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
};

export const VEHICLE_STATUS_COLORS: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    EN_ROUTE: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    LOADING: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    OFFLINE: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
};

// ─── Load Snapshot ───────────────────────────────────────────────────────────

export const LOAD_SNAPSHOT = {
    load_condition: "HIGH",
    arrival_rate_lambda: 0.17,
    fleet_utilization_percent: 78,
    road_disruption_index: 0.62,
    bridge_closure_count: 2,
    partial_road_block_count: 5,
    weather_severity: "SEVERE_RAIN",
    aet_mode: "ACTIVE",
    last_global_reoptimization_min_ago: 22,
};

// ─── Policy Comparison ───────────────────────────────────────────────────────

export type PolicyComparison = {
    policy: string;
    priority_weighted_response_time: number;
    solver_calls: number;
    system_nervousness: number;
    trigger_precision_percent?: number;
    feasibility: string;
};

export const POLICY_COMPARISON: PolicyComparison[] = [
    { policy: "Greedy", priority_weighted_response_time: 208, solver_calls: 0, system_nervousness: 1, feasibility: "LOW" },
    { policy: "Periodic-60", priority_weighted_response_time: 194, solver_calls: 4, system_nervousness: 5, feasibility: "MEDIUM" },
    { policy: "Periodic-30", priority_weighted_response_time: 179, solver_calls: 8, system_nervousness: 6, feasibility: "MEDIUM" },
    { policy: "AET", priority_weighted_response_time: 161, solver_calls: 10, system_nervousness: 4, trigger_precision_percent: 64, feasibility: "HIGH" },
    { policy: "Continuous", priority_weighted_response_time: 149, solver_calls: 57, system_nervousness: 14, feasibility: "HIGH" },
];

// ─── Aggregate Demand (computed) ─────────────────────────────────────────────

export function computeAggregateDemand(): { commodity: string; name: string; total: number }[] {
    const totals: Record<string, number> = {};
    for (const req of REQUESTS) {
        for (const [code, qty] of Object.entries(req.demand)) {
            totals[code] = (totals[code] ?? 0) + qty;
        }
    }
    return COMMODITIES.map((c) => ({ commodity: c.code, name: c.name, total: totals[c.code] ?? 0 }));
}

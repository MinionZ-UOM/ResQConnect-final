"use client";

import { useState } from "react";
import { SimKpiCards } from "../components/simulation/sim-kpi-cards";
import { SimRequestQueue } from "../components/simulation/sim-request-queue";
import { SimDepotInventory } from "../components/simulation/sim-depot-inventory";
import { SimFleetTable } from "../components/simulation/sim-fleet-table";
import { SimAetTrigger } from "../components/simulation/sim-aet-trigger";
import { SimPolicyChart } from "../components/simulation/sim-policy-chart";
import { SimDemandChart } from "../components/simulation/sim-demand-chart";
import { SimAlertsPanel } from "../components/simulation/sim-alerts-panel";
import { SimDispatchRoutes } from "../components/simulation/sim-dispatch-routes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Route, Warehouse, BarChart3 } from "lucide-react";

const sections = [
    { id: "overview", label: "Overview", icon: ClipboardList },
    { id: "routes", label: "Delivery Routes", icon: Route },
    { id: "inventory", label: "Inventory & Fleet", icon: Warehouse },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function AdminSimulationTab() {
    const [activeSection, setActiveSection] = useState<SectionId>("overview");

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Resource Distribution</CardTitle>
                <CardDescription className="text-base">
                    Disaster relief dispatch — requests, vehicles, delivery routes, and depot inventory.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* KPI Summary — always visible */}
                <SimKpiCards />

                {/* Alerts strip — always visible */}
                <SimAlertsPanel />

                {/* Section Switcher */}
                <div className="bg-muted/40 rounded-xl p-1.5 flex gap-1.5">
                    {sections.map((s) => {
                        const Icon = s.icon;
                        const isActive = activeSection === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-lg text-base font-semibold transition-all ${isActive
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                {s.label}
                            </button>
                        );
                    })}
                </div>

                {/* Section Content */}
                {activeSection === "overview" && (
                    <SimRequestQueue />
                )}

                {activeSection === "routes" && (
                    <div className="space-y-6">
                        <SimDispatchRoutes />
                        <SimAetTrigger />
                    </div>
                )}

                {activeSection === "inventory" && (
                    <div className="space-y-6">
                        <SimDepotInventory />
                        <SimFleetTable />
                    </div>
                )}

                {activeSection === "analytics" && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <SimPolicyChart />
                        <SimDemandChart />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

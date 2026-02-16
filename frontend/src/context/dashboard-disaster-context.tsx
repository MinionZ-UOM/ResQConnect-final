"use client";

import { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";
import type { Disaster } from "@/lib/types";

type DashboardDisasterContextValue = {
  disasters: Disaster[];
  joinedDisasterIds: string[];
  joinedDisasters: Disaster[];
};

const DashboardDisasterContext = createContext<DashboardDisasterContextValue | undefined>(undefined);

export function DashboardDisasterProvider({
  value,
  children,
}: PropsWithChildren<{ value: DashboardDisasterContextValue }>) {
  return <DashboardDisasterContext.Provider value={value}>{children}</DashboardDisasterContext.Provider>;
}

export function useDashboardDisasters(): DashboardDisasterContextValue {
  const context = useContext(DashboardDisasterContext);
  if (!context) {
    return { disasters: [], joinedDisasterIds: [], joinedDisasters: [] };
  }
  return context;
}

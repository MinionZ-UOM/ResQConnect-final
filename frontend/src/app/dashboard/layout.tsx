"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import UserNav from "@/components/user-nav";
import {
  LayoutDashboard,
  Users,
  GitPullRequest,
  Package,
  BotMessageSquare,
  LogOut,
  Check,
  Siren,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DisasterCard from "@/components/ui/disaster-card";
import type { Disaster } from "@/lib/types";
import { DashboardDisasterProvider } from "@/context/dashboard-disaster-context";
import {
  checkJoinedStatus,
  getDisasters,
  joinDisaster,
  leaveDisaster,
} from "@/services/disasterService";

// Horizontal nav items per role (ROUTES, not hashes)
const navItems = {
  admin: [
    { href: "/dashboard/admin", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/admin/tasks", icon: GitPullRequest, label: "Task Management" },
    { href: "/dashboard/admin/ai", icon: BotMessageSquare, label: "AI Suggestions" },
    { href: "/dashboard/admin/users", icon: Users, label: "User Management" },
    { href: "/dashboard/admin/resources", icon: Package, label: "Resources" },
  ],
  responder: [
    { href: "/dashboard/responder", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/responder/tasks", icon: GitPullRequest, label: "Manage Tasks" },
  ],
  volunteer: [
    { href: "/dashboard/volunteer", icon: Check, label: "My Tasks" },
  ],
  individual: [
    { href: "/dashboard/individual", icon: Check, label: "My Requests" },
  ],
} as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinedDisasters, setJoinedDisasters] = useState<Set<string>>(new Set());

  const [disasters, setDisasters] = useState<Disaster[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadDisasters = async () => {
      try {
        const fetchedDisasters = await getDisasters();
        console.log(fetchedDisasters);
        if (!isMounted) return;

        setDisasters(fetchedDisasters);

        const joinedStatuses = await Promise.all(
          fetchedDisasters.map(async (disaster) => {
            try {
              const status = await checkJoinedStatus(disaster.id);
              return status.joined ? disaster.id : null;
            } catch (error) {
              console.error("Failed to check joined status", error);
              return null;
            }
          }),
        );

        setJoinedDisasters(new Set(joinedStatuses.filter(Boolean) as string[]));
      } catch (error) {
        console.error("Failed to fetch disasters", error);
      }
    };

    void loadDisasters();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Filter only registered disasters (not pending)
  const registeredDisasters = disasters.filter((d) => d.status === "Registered");

  const joinedDisasterIds = useMemo(() => Array.from(joinedDisasters), [joinedDisasters]);
  const joinedDisasterList = useMemo(
    () => registeredDisasters.filter((disaster) => joinedDisasters.has(disaster.id)),
    [registeredDisasters, joinedDisasters],
  );

  const disasterContextValue = useMemo(
    () => ({
      disasters,
      joinedDisasterIds,
      joinedDisasters: joinedDisasterList,
    }),
    [disasters, joinedDisasterIds, joinedDisasterList],
  );

  const getJoinRole = (): "volunteer" | "first_responder" | "affected_individual" => {
    if (user?.role_id === "first_responder" || user?.role_id === "affected_individual") {
      return user.role_id;
    }
    return "volunteer" as const;
  };

  const handleJoinDisaster = async (disasterId: string) => {
    try {
      await joinDisaster(disasterId, getJoinRole());
      setJoinedDisasters(prev => new Set(prev).add(disasterId));
    } catch (error) {
      console.error("Failed to join disaster", error);
    }
  };

  const handleLeaveDisaster = async (disasterId: string) => {
    try {
      await leaveDisaster(disasterId);
      setJoinedDisasters(prev => {
        const next = new Set(prev);
        next.delete(disasterId);
        return next;
      });
    } catch (error) {
      console.error("Failed to leave disaster", error);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-slate-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const items = navItems[user.role_id] ?? [];

  // identify the role root (first item for the role)
  const roleRoot = items[0]?.href ?? "";

  // exact match for root; prefix match for non-root
  const isActive = (href: string) => {
    if (pathname === href) return true;              // exact match → active
    if (href === roleRoot) return false;             // don't highlight root on subroutes
    return pathname.startsWith(href);                // child pages → active
  };

  return (
    <DashboardDisasterProvider value={disasterContextValue}>
      <div className="min-h-dvh flex flex-col bg-background">
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <Logo className="size-7 text-primary" />
              <span className="text-lg font-semibold">ResQConnect</span>
            </Link>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {user.role_id !== "admin" && (
                <Button className="gap-2" onClick={() => setJoinDialogOpen(true)}>
                  <Siren className="h-4 w-4" />
                  <span className="hidden md:inline">Join Disaster</span>
                </Button>
              )}
              <Button variant="ghost" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
              <UserNav user={user} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">{children}</div>
        </main>

        {/* JOIN Disaster Dialog */}
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Join a Disaster Response</DialogTitle>
              <DialogDescription>
                Select a registered disaster to join and contribute to relief efforts.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6">
              {registeredDisasters.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Siren className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No registered disasters available</p>
                  <p className="text-sm mt-2">Check back later for active disaster responses.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registeredDisasters.map((disaster) => (
                    <DisasterCard
                      key={disaster.id}
                      disaster={disaster}
                      onJoin={handleJoinDisaster}
                      onLeave={handleLeaveDisaster}
                      isJoined={joinedDisasters.has(disaster.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardDisasterProvider>
  );
}
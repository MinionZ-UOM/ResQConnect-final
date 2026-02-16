"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Logo from '@/components/logo';
import { getDashboardRoute } from '@/lib/types/role-routing';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(getDashboardRoute(user as any));
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center h-full">
       <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 animate-spin" />
          <p className="text-slate-700">Redirecting to your dashboard...</p>
        </div>
    </div>
  );
}

"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserCreate, UserRole } from '@/lib/types';
import { registerUser, getCurrentUser } from '@/services/userService';
import { getAccessToken, setAccessToken, clearAccessToken } from '@/lib/auth-tokens';
import { firebaseSignIn, firebaseSignOut, firebaseSignUp } from '@/lib/firebaseClient';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/logo';
import { getDashboardRouteSlug } from '@/lib/types/role-routing';

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, email: string, password: string) => Promise<void>;
  signup: (role: UserRole, userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const current = await getCurrentUser();
          setUser(current);
        }
      } catch {
        clearAccessToken();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (role: UserRole, email: string, password: string) => {
    setLoading(true);
    try {
      const firebaseUser = await firebaseSignIn(email, password);
      const idToken = await firebaseUser.getIdToken();
      setAccessToken(idToken);
  
      const payload: UserCreate = {
        display_name: firebaseUser.displayName || email.split('@')[0],
        role_id: role,
      };
  
      const registered = await registerUser(payload);
      setUser(registered);
      localStorage.setItem('resq-user', JSON.stringify(registered));
  
      const routeRole = getDashboardRouteSlug(registered.role_id, registered.role);

      // Redirect to correct dashboard route
      router.push(`/dashboard/${routeRole}`);
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (role: UserRole, userData: Partial<User>) => {
    setLoading(true);
    try {
      //  Create Firebase user
      const firebaseUser = await firebaseSignUp(userData.email || "", userData.password || "");
      const idToken = await firebaseUser.getIdToken();
      setAccessToken(idToken);
  
      // Register in backend
      const payload: UserCreate = {
        display_name: userData.display_name || userData.email?.split("@")[0] || "User",
        role_id: role,
      };
  
      const registered = await registerUser(payload);
      setUser(registered);
      localStorage.setItem("resq-user", JSON.stringify(registered));
  
      const routeRole = getDashboardRouteSlug(registered.role_id, registered.role);
      router.push(`/dashboard/${routeRole}`);
    } catch (err) {
      console.error("Signup failed:", err);
    } finally {
      setLoading(false);
    }
  };
  

  const logout = async () => {
    try {
      await firebaseSignOut();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      clearAccessToken();
      localStorage.removeItem('resq-user');
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur">
          <Logo className="h-12 w-12 text-primary animate-pulse" />
          <div className="flex items-center gap-3 text-lg font-medium text-primary">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            <span>Redirecting to the Dashboard...</span>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

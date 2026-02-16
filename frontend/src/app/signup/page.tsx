"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/logo";
import type { Role } from "@/lib/types";
import { ShieldCheck, User, HeartHandshake, UserCheck, Loader2 } from "lucide-react";
import { getDashboardRoute } from "@/lib/types/role-routing";

function SignupFormComponent() {
  const router = useRouter();
  const { signup, user, loading } = useAuth();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as Role) || "individual";
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(getDashboardRoute(user as any));
    }
  }, [loading, user, router]);

  // Map frontend role → backend role_id
  const roleIdMap: Record<Role, string> = {
    admin: "admin",
    responder: "first_responder",
    volunteer: "volunteer",
    individual: "affected_individual",
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const role = formData.get("role") as Role;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(roleIdMap[role] as any, {
        display_name: name,
        email,
        password,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (value: string) => {
    router.push(`/signup?role=${value}`, { scroll: false });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <Tabs
          defaultValue={initialRole}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="individual" className="flex-col h-auto p-3 gap-1">
              <HeartHandshake className="w-5 h-5" />
              <span>Individual</span>
            </TabsTrigger>
            <TabsTrigger value="volunteer" className="flex-col h-auto p-3 gap-1">
              <UserCheck className="w-5 h-5" />
              <span>Volunteer</span>
            </TabsTrigger>
            <TabsTrigger value="responder" className="flex-col h-auto p-3 gap-1">
              <User className="w-5 h-5" />
              <span>Responder</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex-col h-auto p-3 gap-1">
              <ShieldCheck className="w-5 h-5" />
              <span>Admin</span>
            </TabsTrigger>
          </TabsList>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="capitalize font-headline">
                Sign up as {initialRole}
              </CardTitle>
              <CardDescription>
                Enter your details to create an account as {initialRole}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <input type="hidden" name="role" value={initialRole} />

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                  />
                </div>

                <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      <span>Creating your account...</span>
                    </span>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Tabs>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-primary">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupFormComponent />
    </Suspense>
  );
}

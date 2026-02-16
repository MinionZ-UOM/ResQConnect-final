"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HandHeart, Shield, UserPlus } from 'lucide-react';
import Logo from '@/components/logo';
import { useAuth } from '@/context/auth-context';
import { getDashboardRoute } from '@/lib/types/role-routing';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace(getDashboardRoute(user as any));
    }
  }, [loading, user, router]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground font-headline">ResQConnect</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Login</Link>
        </Button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold font-headline text-primary">Connecting Help with Those in Need.</h2>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            ResQConnect is a community-driven platform for disaster response, enabling quick and efficient coordination between affected individuals, volunteers, and response teams.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto bg-accent/20 rounded-full p-4 w-fit">
                <HandHeart className="h-10 w-10 text-accent-foreground" />
              </div>
              <CardTitle className="mt-4 font-headline">Request Assistance</CardTitle>
              <CardDescription>Are you affected by a disaster? Submit a request for help and get connected with responders quickly.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link href="/login?role=individual">Get Help</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto bg-accent/20 rounded-full p-4 w-fit">
                <UserPlus className="h-10 w-10 text-accent-foreground" />
              </div>
              <CardTitle className="mt-4 font-headline">Become a Volunteer</CardTitle>
              <CardDescription>Join our team of dedicated volunteers and make a difference in your community during times of crisis.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link href="/login?role=volunteer">Offer Help</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto bg-accent/20 rounded-full p-4 w-fit">
                <Shield className="h-10 w-10 text-accent-foreground" />
              </div>
              <CardTitle className="mt-4 font-headline">Responder & Admin</CardTitle>
              <CardDescription>Authorized personnel can log in here to manage tasks, resources, and coordinate response efforts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg" variant="outline">
                <Link href="/login?role=responder">Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="p-4 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} ResQConnect. All rights reserved.
      </footer>
    </div>
  );
}

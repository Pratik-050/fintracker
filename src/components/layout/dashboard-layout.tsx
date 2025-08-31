"use client";

import { useSession, signIn } from "next-auth/react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModeToggle } from "../theme/theme-toggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-br">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              Welcome to Fintracker
            </CardTitle>
            <CardDescription>
              Track your income and expenses with ease
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => signIn("google")}>
              Sign In with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
          <div className="flex h-14 items-center justify-between px-4">
            <SidebarTrigger />
            <ModeToggle />
          </div>
        </div>
        <div className="flex-1 space-y-4 p-4 pt-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}

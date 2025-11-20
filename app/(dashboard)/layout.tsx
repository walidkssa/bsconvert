"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { TopNav } from "@/components/top-nav";
import { SidebarProvider, useSidebar } from "@/components/sidebar-provider";

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update CSS variable when sidebar state changes
  React.useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? '64px' : '256px'
    );
  }, [isCollapsed]);

  // Calculate margin based on mounted state and window width
  const getMarginLeft = () => {
    if (!isMounted) return '0';
    if (window.innerWidth < 768) return '0';
    return isCollapsed ? '64px' : '256px';
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      {/* Main content with dynamic left margin based on sidebar state */}
      <div
        className="flex flex-1 flex-col transition-all duration-300"
        style={{
          marginLeft: getMarginLeft()
        }}
      >
        <TopNav />
        <main className="flex-1 p-6 md:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Upload,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./sidebar-provider";
import { Logo } from "./logo";
import { SubscriptionModal } from "./subscription-modal";

// Navigation items
const navigation = [
  {
    title: "Espace de travail",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Nouveau",
        url: "/convert",
        icon: Upload,
      },
      {
        title: "Historique",
        url: "/history",
        icon: History,
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [showSubscriptionModal, setShowSubscriptionModal] = React.useState(false);

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex h-screen flex-col border-r border-border bg-background fixed left-0 top-0 z-50 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
      {/* Header */}
      <div className="border-b border-border h-[65px] flex items-center relative px-4">
        <Link href="/" className="flex items-center group">
          {isCollapsed ? (
            <img
              src="/icon.png"
              alt="BS Convert"
              className="h-8 w-8 object-contain transition-all group-hover:scale-105"
            />
          ) : (
            <Logo className="h-6 w-auto object-contain transition-all group-hover:scale-105" />
          )}
        </Link>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-accent z-50"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto px-3 py-4">
        {navigation.map((group) => (
          <div key={group.title} className="mb-6">
            {!isCollapsed && (
              <h3 className="mb-2 px-3 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground truncate">
                {group.title}
              </h3>
            )}
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent",
                      isActive && "bg-accent font-medium",
                      isCollapsed && "justify-center"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        {/* Upgrade Button */}
        <Button
          variant="default"
          size="sm"
          className={cn(
            "w-full mb-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            isCollapsed && "px-2"
          )}
          onClick={() => setShowSubscriptionModal(true)}
          title={isCollapsed ? "Upgrade" : undefined}
        >
          <Sparkles className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="ml-2">Upgrade</span>}
        </Button>

        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? "Paramètres" : undefined}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Paramètres</span>}
        </Link>
        {!isCollapsed && (
          <div className="mt-4 px-3 text-xs text-muted-foreground">
            <p className="font-mono">v1.0.0</p>
          </div>
        )}
      </div>
    </aside>

    {/* Subscription Modal */}
    <SubscriptionModal
      open={showSubscriptionModal}
      onOpenChange={setShowSubscriptionModal}
    />
  </>
  );
}

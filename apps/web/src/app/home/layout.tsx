"use client";

import React, { useState } from "react";
import { Navbar, OnboardingSidebar } from "@/components/layout";
import { AuthGate } from "@/components/auth/AuthGate";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <AuthGate>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        {/* Navbar Top Full Width */}
        <Navbar
          onMenuToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Onboarding Sidebar */}
          <OnboardingSidebar isCollapsed={isSidebarCollapsed} />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, Navbar } from "@/components/layout";
import { AuthGate } from "@/components/auth/AuthGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent hydration mismatch by returning a clean structure before mount
  if (!mounted) {
    return (
      <AuthGate>
        <div className="flex flex-col h-screen overflow-hidden bg-background">
          <Navbar onMenuToggle={() => {}} isSidebarCollapsed={false} />
          <div className="flex flex-1 overflow-hidden relative">
            <main className="flex-1 overflow-y-auto bg-background">{children}</main>
          </div>
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        {/* Navbar Top Full Width */}
        <Navbar
          onMenuToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile overlay */}
          {!isSidebarCollapsed && (
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setIsSidebarCollapsed(true)}
            />
          )}

          {/* Sidebar */}
          <Sidebar isCollapsed={isSidebarCollapsed} />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}

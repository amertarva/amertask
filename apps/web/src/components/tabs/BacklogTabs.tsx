import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function BacklogTabs({ activeTab, setActiveTab }: any) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <Button
        variant={activeTab === "product" ? "primary" : "ghost"}
        className={cn(
          activeTab !== "product" &&
            "border border-border bg-card text-text-muted hover:bg-muted",
        )}
        onClick={() => setActiveTab("product")}
      >
        Product Backlog
      </Button>
      <Button
        variant={activeTab === "priority" ? "primary" : "ghost"}
        className={cn(
          activeTab !== "priority" &&
            "border border-border bg-card text-text-muted hover:bg-muted",
        )}
        onClick={() => setActiveTab("priority")}
      >
        Priority Backlog
      </Button>
    </div>
  );
}

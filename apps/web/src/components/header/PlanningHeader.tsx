import React from "react";
import { Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExportToDocsButton } from "@/components/ui/ExportToDocsButton";

export function PlanningHeader({
  onCreateClick,
  teamSlug,
}: {
  onCreateClick: () => void;
  teamSlug: string;
}) {
  return (
    <div className="sticky top-0 z-50 bg-[hsl(var(--background))] px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border">
      <div>
        <h1 className="text-3xl font-extrabold text-text tracking-tight">
          Sprint Planning
        </h1>
        <p className="text-text-muted mt-2">
          Detail rencana eksekusi backlog dan penugasan untuk siklus sprint ini.
        </p>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Cari Backlog ID..."
            suppressHydrationWarning
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-text transition-colors shadow-sm"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="border border-border bg-card shadow-sm text-text-muted"
        >
          <Filter className="w-4 h-4" />
        </Button>
        <ExportToDocsButton
          teamSlug={teamSlug}
          type="planning"
          className="shrink-0"
          onSuccess={(documentUrl) => window.open(documentUrl, "_blank")}
        />
        <Button
          onClick={onCreateClick}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          Planning Baru
        </Button>
      </div>
    </div>
  );
}

import React from "react";
import { Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExportToDocsButton } from "@/components/ui/ExportToDocsButton";

interface BacklogHeaderProps {
  teamSlug: string;
  onCreateClick: (value: boolean) => void;
  onSetEditForm: (value: Record<string, unknown>) => void;
  onSetOpenMenuId: (value: string | null) => void;
}

export function BacklogHeader({
  teamSlug,
  onCreateClick,
  onSetEditForm,
  onSetOpenMenuId,
}: BacklogHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-border pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
          Katalog Backlog
        </h1>
        <p className="text-text-muted mt-2">
          Daftar produk fitur dan urutan prioritas penanganan isu aktif dari
          hasil execution.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
        <div className="flex gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari ID atau fitur..."
              suppressHydrationWarning
              className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-text transition-colors shadow-sm"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="border border-border bg-card shadow-sm text-text-muted shrink-0"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <ExportToDocsButton
            teamSlug={teamSlug}
            type="backlog"
            className="flex-1 sm:flex-none shrink-0"
            onSuccess={(documentUrl) => window.open(documentUrl, "_blank")}
          />
          <Button
            onClick={() => {
              onCreateClick(true);
              onSetEditForm({});
              onSetOpenMenuId(null);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1 sm:flex-none shadow-sm whitespace-nowrap"
          >
            Pilih dari Execution
          </Button>
        </div>
      </div>
    </div>
  );
}

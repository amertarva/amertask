import { FileText, Check, Trash2 } from "lucide-react";
import type { FrListProps } from "@/types/components/RequirementsTypes";

export function FrList({ requirements, onDelete }: FrListProps) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <h2 className="text-lg font-bold text-text">
            Functional Requirements (FR)
          </h2>
        </div>
        <span className="text-xs font-semibold text-text-muted bg-muted px-2.5 py-1 rounded-full border border-border">
          {requirements.length} Item
        </span>
      </div>

      {requirements.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-text-muted text-sm border-2 border-dashed border-border rounded-xl bg-muted/30">
          <FileText className="w-8 h-8 mb-3 opacity-20" />
          Belum ada Functional Requirements.
        </div>
      ) : (
        <div className="space-y-4">
          {requirements.map((fr) => (
            <div
              key={fr.id}
              className="p-4 rounded-xl border border-border bg-background hover:border-blue-500/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                      {fr.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        fr.priority === "MUST"
                          ? "bg-priority-urgent/10 border-priority-urgent/20 text-priority-urgent"
                          : fr.priority === "SHOULD"
                            ? "bg-priority-high/10 border-priority-high/20 text-priority-high"
                            : "bg-muted border-border text-text-muted"
                      }`}
                    >
                      {fr.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text mb-2 leading-relaxed">
                    {fr.description}
                  </p>
                  {fr.acceptanceCriteria && (
                    <div className="flex gap-2 items-start text-xs text-text-muted bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      <Check className="w-3.5 h-3.5 text-status-done shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        {fr.acceptanceCriteria}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onDelete(fr.id)}
                  className="text-text-muted hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Hapus Requirement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

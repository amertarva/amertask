import { ListTodo, Wand2, Copy } from "lucide-react";
import type { RequirementsHeaderProps } from "@/types/components/RequirementsTypes";
import { Button } from "@/components/ui/Button";

export function RequirementsHeader({
  teamSlug,
  hasBacklog,
  onGenerateClick,
  onCopyToDocsClick,
}: RequirementsHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8 border-b border-border pb-4 sm:pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-center gap-3 break-words">
          <ListTodo className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
          Requirements
        </h1>
        <p className="text-text-muted mt-2">
          Functional Requirements (FR) dan Non-Functional Requirements (NFR)
          untuk tim {teamSlug}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onGenerateClick}
          disabled={!hasBacklog}
          leftIcon={<Wand2 className="w-4 h-4" />}
          className="font-bold border border-primary-hover transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Auto-Draft dengan AI
        </Button>
        <Button
          onClick={onCopyToDocsClick}
          variant="ghost"
          leftIcon={<Copy className="w-4 h-4" />}
          className="border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary transition-all font-semibold shadow-sm active:scale-95"
        >
          Ekspor ke Google Docs
        </Button>
      </div>
    </div>
  );
}

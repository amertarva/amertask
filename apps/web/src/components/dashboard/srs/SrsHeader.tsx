import { FileSignature, Save, Copy } from "lucide-react";
import type { SrsHeaderProps } from "@/types/components/SrsTypes";
import { Button } from "@/components/ui/Button";

export function SrsHeader({ teamSlug, onSave, onCopyToDocs }: SrsHeaderProps) {
  return (
    <div className="border-b border-border pb-4 sm:pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-center gap-3 break-words">
          <FileSignature className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
          SRS Document
        </h1>
        <p className="text-text-muted mt-2">
          Software Requirements Specification — {teamSlug.toUpperCase()}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onSave}
          leftIcon={<Save className="w-4 h-4" />}
          className="font-semibold border border-primary-hover transition-all active:scale-95"
        >
          Simpan
        </Button>
        <Button
          onClick={onCopyToDocs}
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

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Telescope,
  Plug,
  ChevronDown,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { srsApi } from "@/lib/core/srs.api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type {
  SrsFieldConfig,
  SrsFieldProps,
  SrsSectionProps,
  SrsEditData,
  SrsFieldValue,
  SrsJsonItem,
} from "@/types/components/SrsTypes";
import type { SrsSectionKey } from "@/lib/core/srs.api";

// ─── Komponen utama ───────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  "file-text": FileText,
  telescope: Telescope,
  plug: Plug,
};

export function SrsSection({
  group,
  editData,
  teamSlug,
  onChange,
}: SrsSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const IconComponent = ICON_MAP[group.icon] || FileText;

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
      {/* Header section — klik untuk collapse/expand */}
      <button
        onClick={() => setCollapsed((p) => !p)}
        className="w-full flex items-center justify-between px-6 py-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-text">
              {group.number}. {group.title}
            </span>
            <FilledBadge fields={group.fields} editData={editData} />
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-text-muted transition-transform duration-300",
            collapsed ? "-rotate-90" : "rotate-0",
          )}
        />
      </button>

      {/* Field list */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 py-6 flex flex-col gap-8 border-t border-border/50">
              {group.fields.map((field) => (
                <SrsField
                  key={field.key}
                  field={field}
                  value={editData[field.key]}
                  teamSlug={teamSlug}
                  onChange={onChange}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Badge jumlah field terisi ────────────────────────────────────────────────

function FilledBadge({
  fields,
  editData,
}: {
  fields: SrsFieldConfig[];
  editData: SrsEditData;
}) {
  const filled = fields.filter((f) => {
    const val = editData[f.key];
    if (!val) return false;
    if (Array.isArray(val)) return val.length > 0;
    return String(val).trim().length > 0;
  }).length;

  if (filled === 0) return null;

  const isComplete = filled === fields.length;

  return (
    <span
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tight border transition-colors",
        isComplete
          ? "bg-green-500/10 border-green-500/20 text-green-500"
          : "bg-muted border-border text-text-muted",
      )}
    >
      {filled}/{fields.length} {isComplete ? "Selesai" : "Terisi"}
    </span>
  );
}

// ─── Komponen satu field dengan tombol AI ────────────────────────────────────

function SrsField({ field, value, teamSlug, onChange }: SrsFieldProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState(false);

  const handleAiGenerate = useCallback(async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const result = await srsApi.aiGenerateSection(teamSlug, field.key);

      if (field.isJson) {
        try {
          const parsed = JSON.parse(result.content);
          onChange(field.key, parsed);
        } catch {
          onChange(field.key, result.content);
        }
      } else {
        onChange(field.key, result.content);
      }

      setJustGenerated(true);
      setTimeout(() => setJustGenerated(false), 3000);
    } catch (err: unknown) {
      setAiError(
        err instanceof Error ? err.message : "AI gagal generate konten ini",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [teamSlug, field, onChange]);

  const hasValue = field.isJson
    ? Array.isArray(value) && value.length > 0
    : Boolean(value && String(value).trim());

  return (
    <div className="group/field relative">
      {/* Label + AI button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-text flex items-center gap-2">
            {field.label}
            {hasValue && (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            )}
          </label>
        </div>

        {/* Tombol AI per field */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAiGenerate}
          disabled={isGenerating}
          className={cn(
            "h-8 px-3 rounded-full text-[11px] font-bold transition-all gap-1.5",
            justGenerated
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : "bg-primary/5 text-primary hover:bg-primary/10 border border-primary/10",
          )}
        >
          {isGenerating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : justGenerated ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {isGenerating
            ? "Menganalisis..."
            : justGenerated
              ? "Berhasil!"
              : "AI Generate"}
        </Button>
      </div>

      {/* Hint text */}
      <p className="text-xs text-text-muted mb-3 leading-relaxed">
        {field.hint}
      </p>

      {/* Input — textarea untuk teks, editor khusus untuk JSON */}
      {field.isJson ? (
        <JsonFieldEditor
          fieldKey={field.key}
          value={value}
          onChange={onChange}
        />
      ) : (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          rows={field.rows ?? 4}
          placeholder={`Isi ${field.label} atau gunakan AI untuk membuat draft otomatis...`}
          className={cn(
            "w-full px-4 py-3 text-sm rounded-xl transition-all outline-none bg-background custom-scrollbar resize-y border",
            hasValue
              ? "border-border focus:border-primary/50"
              : "border-border/60 border-dashed focus:border-primary focus:border-solid",
          )}
        />
      )}

      {/* Error AI */}
      <AnimatePresence>
        {aiError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-[11px] font-medium text-priority-urgent flex items-center gap-1.5"
          >
            <span className="inline-block w-1 h-1 rounded-full bg-priority-urgent" />
            {aiError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Editor khusus untuk field JSON (glossary, userCharacteristics) ──────────

function JsonFieldEditor({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: SrsSectionKey;
  value: SrsFieldValue;
  onChange: (key: SrsSectionKey, value: SrsFieldValue) => void;
}) {
  type SrsJsonFieldKey = "term" | "definition" | "role" | "description";

  const items: SrsJsonItem[] = Array.isArray(value) ? value : [];

  const isGlossary = fieldKey === "glossary";
  const fields: Array<{
    key: SrsJsonFieldKey;
    placeholder: string;
    flex: string;
  }> = isGlossary
    ? [
        { key: "term", placeholder: "Istilah (e.g. REST)", flex: "flex-1" },
        {
          key: "definition",
          placeholder: "Definisi istilah...",
          flex: "flex-[2]",
        },
      ]
    : [
        { key: "role", placeholder: "Nama Role (e.g. Admin)", flex: "flex-1" },
        {
          key: "description",
          placeholder: "Tanggung jawab role...",
          flex: "flex-[2]",
        },
      ];

  const addItem = () => {
    const newItem = isGlossary
      ? { term: "", definition: "" }
      : { role: "", description: "" };
    onChange(fieldKey, [...items, newItem]);
  };

  const updateItem = (idx: number, field: SrsJsonFieldKey, val: string) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: val } : item,
    );
    onChange(fieldKey, updated);
  };

  const removeItem = (idx: number) => {
    onChange(
      fieldKey,
      items.filter((_, i) => i !== idx),
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
          <p className="text-xs text-text-muted italic">
            Belum ada data. Tambahkan manual atau klik tombol AI Generate di
            atas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2"
            >
              {fields.map((f) => (
                <div key={f.key} className={cn(f.flex)}>
                  <input
                    value={
                      (item as Record<SrsJsonFieldKey, string>)[f.key] ?? ""
                    }
                    onChange={(e) => updateItem(idx, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full h-10 px-3 text-xs bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(idx)}
                className="h-10 w-10 shrink-0 text-text-muted hover:text-priority-urgent hover:bg-priority-urgent/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        onClick={addItem}
        className="self-start text-[11px] font-bold text-text-muted hover:text-primary transition-colors gap-1.5 h-8 px-3 rounded-lg border border-dashed border-border hover:border-primary/50"
      >
        <Plus className="w-3.5 h-3.5" />
        Tambah {isGlossary ? "Istilah" : "User Role"}
      </Button>
    </div>
  );
}

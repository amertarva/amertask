"use client";

import {
  Link as LinkIcon,
  FileText,
  Settings,
  ClipboardList,
  CalendarDays,
  Activity,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from "lucide-react";
import { type FormState } from "./types";
import { type ProjectIntegrationsSectionProps } from "@/types/components/ProjectSettingsTypes";

function DocsLinkBadge({ url, label }: { url: string; label: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-colors cursor-pointer"
      title={url}
    >
      <ExternalLink className="w-3 h-3" />
      {label} tersambung
    </a>
  );
}

export function ProjectIntegrationsSection({
  form,
  setForm,
}: ProjectIntegrationsSectionProps) {
  const isSeparateMode = form.separateDocsEnabled;

  // Check if any per-tab URLs are already configured
  const hasAnyPerTabUrl = !!(
    form.backlogDocs ||
    form.planningDocs ||
    form.executionDocs
  );

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
      <h2 className="text-xl sm:text-2xl font-extrabold text-text mb-2">
        Integrasi
      </h2>
      <p className="text-sm font-medium text-text-muted">
        Hubungkan proyek dengan layanan eksternal untuk dokumentasi dan
        kolaborasi kode.
      </p>

      <div className="grid grid-cols-1 gap-6 mt-8">
        {/* GitHub Repository */}
        <label className="space-y-2">
          <span className="text-sm font-bold text-text ml-1 flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> GitHub Repository
          </span>
          <input
            type="url"
            value={form.githubRepo}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                githubRepo: e.target.value,
              }))
            }
            placeholder="https://github.com/org/repo"
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
          />
        </label>

        {/* ── Google Docs Export Section ── */}
        <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-muted/20 border border-border/50">
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-text flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Google Docs Export
            </h3>

            {/* Toggle: Single vs Separate */}
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  separateDocsEnabled: !prev.separateDocsEnabled,
                }))
              }
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer group"
              style={{
                borderColor: isSeparateMode
                  ? "hsl(var(--primary) / 0.4)"
                  : "hsl(var(--border))",
                backgroundColor: isSeparateMode
                  ? "hsl(var(--primary) / 0.06)"
                  : "transparent",
              }}
            >
              <div className="text-left">
                <p className="text-sm font-bold text-text">
                  {isSeparateMode
                    ? "Mode Dokumen Terpisah"
                    : "Mode Dokumen Tunggal"}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {isSeparateMode
                    ? "Backlog, Planning & Execution masing-masing diekspor ke dokumen berbeda"
                    : "Semua data diekspor ke satu dokumen Google Docs yang sama"}
                </p>
              </div>
              <div className="shrink-0">
                {isSeparateMode ? (
                  <ToggleRight className="w-8 h-8 text-primary transition-colors" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-text-muted group-hover:text-text transition-colors" />
                )}
              </div>
            </button>
          </div>

          {/* Main Google Docs URL */}
          <label className="space-y-2">
            <span className="text-sm font-bold text-text ml-1 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              {isSeparateMode
                ? "Google Docs URL (Fallback)"
                : "Google Docs URL"}
            </span>
            <input
              type="url"
              value={form.googleDocsUrl}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  googleDocsUrl: e.target.value,
                }))
              }
              placeholder="https://docs.google.com/document/d/..."
              className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
            />
            <p className="text-xs text-text-muted ml-1">
              {isSeparateMode
                ? "Digunakan jika URL per tab di bawah belum diisi."
                : "Semua export Backlog, Planning & Execution akan masuk ke dokumen ini."}
            </p>
          </label>

          {/* Connected links summary — show when NOT in separate mode but URLs exist */}
          {!isSeparateMode && hasAnyPerTabUrl && (
            <div className="space-y-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                📌 URL per tab yang tersimpan (aktifkan toggle untuk mengedit):
              </p>
              <div className="flex flex-wrap gap-2">
                <DocsLinkBadge url={form.backlogDocs} label="Backlog" />
                <DocsLinkBadge url={form.planningDocs} label="Planning" />
                <DocsLinkBadge url={form.executionDocs} label="Execution" />
              </div>
              <p className="text-xs text-text-muted">
                ⚡ URL per tab tetap digunakan saat export meskipun toggle mati.
                Toggle hanya menampilkan/menyembunyikan field edit.
              </p>
            </div>
          )}

          {/* Per-Tab URL Fields — shown when toggle is ON */}
          {isSeparateMode && (
            <div
              className="space-y-4 pt-4 border-t border-border/40"
              style={{ animation: "fade-in 0.25s ease-out" }}
            >
              <p className="text-xs font-semibold text-primary ml-1 uppercase tracking-wider">
                URL per Tab
              </p>

              <label className="space-y-2">
                <span className="text-sm font-bold text-text ml-1 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-500" /> Backlog
                  {form.backlogDocs && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 dark:text-green-400">
                      TERSAMBUNG
                    </span>
                  )}
                </span>
                <input
                  type="url"
                  value={form.backlogDocs || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      backlogDocs: e.target.value,
                    }))
                  }
                  placeholder="https://docs.google.com/document/d/..."
                  className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-text ml-1 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-500" /> Planning
                  {form.planningDocs && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 dark:text-green-400">
                      TERSAMBUNG
                    </span>
                  )}
                </span>
                <input
                  type="url"
                  value={form.planningDocs || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      planningDocs: e.target.value,
                    }))
                  }
                  placeholder="https://docs.google.com/document/d/..."
                  className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-text ml-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" /> Execution
                  {form.executionDocs && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 dark:text-green-400">
                      TERSAMBUNG
                    </span>
                  )}
                </span>
                <input
                  type="url"
                  value={form.executionDocs || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      executionDocs: e.target.value,
                    }))
                  }
                  placeholder="https://docs.google.com/document/d/..."
                  className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
                />
              </label>
            </div>
          )}
        </div>

        {/* Requirements & SRS — always visible, separate from the toggle */}
        <label className="space-y-2">
          <span className="text-sm font-bold text-text ml-1 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Google Docs (FR & NFR)
          </span>
          <input
            type="url"
            value={form.rDocs || ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                rDocs: e.target.value,
              }))
            }
            placeholder="https://docs.google.com/document/d/..."
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
          />
          <p className="text-xs text-text-muted ml-1">
            Dokumen Google Docs untuk Functional & Non-Functional Requirements
          </p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-text ml-1 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Google Docs (SRS)
          </span>
          <input
            type="url"
            value={form.srsDocs || ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                srsDocs: e.target.value,
              }))
            }
            placeholder="https://docs.google.com/document/d/..."
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
          />
          <p className="text-xs text-text-muted ml-1">
            Dokumen Google Docs untuk Software Requirements Specification
          </p>
        </label>
      </div>
    </div>
  );
}

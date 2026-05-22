"use client";

import {
  Settings,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ListTodo,
  Shield,
} from "lucide-react";
import type { Requirement } from "@/lib/core/requirements.api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { SrsRequirementsPreviewProps } from "@/types/components/SrsTypes";

export function SrsRequirementsPreview({
  number,
  title,
  icon,
  requirements,
  teamSlug,
  type,
}: SrsRequirementsPreviewProps) {
  const isFR = type === "FR";
  const IconComponent = isFR ? ListTodo : Shield;

  // Group by issue
  const grouped: Record<
    string,
    { issue: { number: number; title: string } | null; reqs: Requirement[] }
  > = {};
  for (const req of requirements) {
    const key = req.issue?.number ? String(req.issue.number) : "unassigned";
    if (!grouped[key]) {
      grouped[key] = { issue: req.issue || null, reqs: [] };
    }
    grouped[key].reqs.push(req);
  }

  const sortedGroups = Object.values(grouped).sort((a, b) => {
    if (!a.issue) return 1;
    if (!b.issue) return -1;
    return a.issue.number - b.issue.number;
  });

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
      {/* Header section */}
      <div className="px-6 py-5 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "p-2.5 rounded-xl transition-colors",
              isFR
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "bg-purple-500/10 text-purple-600 dark:text-purple-400",
            )}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-text">
              {number}. {title}
            </h2>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tight border",
                requirements.length > 0
                  ? "bg-primary/5 border-primary/20 text-primary"
                  : "bg-muted border-border text-text-muted",
              )}
            >
              {requirements.length} Item
            </span>
          </div>
        </div>
        <Link
          href={`/projects/${teamSlug}/requirements`}
          className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group"
        >
          Kelola di Halaman Requirements
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      <div className="p-6">
        {requirements.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
            <div className="p-3 rounded-full bg-muted mb-4 opacity-50">
              <IconComponent className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-sm font-bold text-text mb-1">Belum ada {type}</p>
            <p className="text-xs text-text-muted max-w-[240px]">
              Kebutuhan sistem akan otomatis muncul di sini setelah dibuat di
              halaman Requirements.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedGroups.map((group, gIdx) => (
              <div
                key={gIdx}
                className="border border-border rounded-xl overflow-hidden bg-background/50 shadow-sm transition-all hover:bg-background"
              >
                <div className="bg-muted/40 px-4 py-3 border-b border-border flex items-center gap-3">
                  {group.issue ? (
                    <>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        #{group.issue.number}
                      </span>
                      <span className="text-sm font-bold text-text leading-none">
                        {group.issue.title}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-text-muted">
                      Global / Kebutuhan Umum
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="py-2.5 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider w-20">
                          ID
                        </th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          Deskripsi Kebutuhan
                        </th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider w-32">
                          Prioritas
                        </th>
                        {!isFR && (
                          <th className="py-2.5 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider w-40">
                            Kategori
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {group.reqs.map((req, rIdx) => {
                        const priorityStr = (
                          req.priority as string
                        ).toUpperCase();
                        return (
                          <tr
                            key={req.id}
                            className="hover:bg-muted/10 transition-colors group/row"
                          >
                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-primary align-top">
                              {type}-{String(rIdx + 1).padStart(2, "0")}
                            </td>
                            <td className="py-3.5 px-4 text-sm text-text-muted leading-relaxed align-top">
                              {req.description}
                              {req.acceptanceCriteria && (
                                <div className="mt-2 p-2.5 rounded-lg bg-muted/30 border border-border/40 text-[11px] leading-relaxed italic">
                                  <span className="font-bold text-text-muted not-italic">
                                    Acceptance:
                                  </span>{" "}
                                  {req.acceptanceCriteria}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 align-top">
                              <span
                                className={cn(
                                  "text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter transition-all",
                                  priorityStr === "MUST" ||
                                    priorityStr === "URGENT"
                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                    : priorityStr === "SHOULD" ||
                                        priorityStr === "HIGH"
                                      ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                      : priorityStr === "COULD" ||
                                          priorityStr === "MEDIUM"
                                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        : "bg-slate-500/10 text-slate-500 border-slate-500/20",
                                )}
                              >
                                {req.priority}
                              </span>
                            </td>
                            {!isFR && (
                              <td className="py-3.5 px-4 text-[11px] font-bold text-purple-600/70 align-top">
                                {req.nfrCategory || "General"}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

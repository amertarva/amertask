"use client";

import { Hash, ListTodo, ShieldCheck } from "lucide-react";
import type { SrsMetadataProps } from "@/types/components/SrsTypes";

export function SrsMetadata({
  version,
  onVersionChange,
  frCount,
  nfrCount,
}: SrsMetadataProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {/* Versi Card */}
      <div className="flex flex-col gap-1.5 min-w-[140px] px-4 py-3 rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md group">
        <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
          <Hash className="w-3 h-3 group-hover:text-primary transition-colors" />
          Versi Dokumen
        </label>
        <input
          value={version}
          onChange={(e) => onVersionChange(e.target.value)}
          placeholder="1.0.0"
          className="text-sm font-mono font-bold text-text bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
        />
      </div>

      {/* Requirements Summary Card */}
      <div className="flex items-center gap-6 px-5 py-3 rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
        {/* FR */}
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <ListTodo className="w-3 h-3 text-blue-500" />
            Functional
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-text">{frCount}</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">
              Items
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-border/60" />

        {/* NFR */}
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3 text-purple-500" />
            Non-Functional
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-text">{nfrCount}</span>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded uppercase">
              Items
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";

export default function AnalyticsPreview() {
  return (
    <div className="flex-1 p-6 md:p-8 bg-background/30 overflow-hidden flex flex-col gap-6 relative animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            Analytics
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Last 30 days performance
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium text-text bg-card shadow-sm cursor-pointer hover:bg-muted transition-colors">
            This Month
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-text-muted mb-2">
            Issues Completed
          </div>
          <div className="text-3xl font-bold flex items-end gap-2 text-text">
            124{" "}
            <span className="text-xs text-status-done mb-1.5 font-semibold bg-status-done/10 px-1.5 py-0.5 rounded-md border border-status-done/20">
              +14%
            </span>
          </div>
        </div>
        <div className="p-5 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-text-muted mb-2">
            Cycle Time
          </div>
          <div className="text-3xl font-bold flex items-end gap-2 text-text">
            2.4d{" "}
            <span className="text-xs text-primary mb-1.5 font-semibold bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20">
              -0.2d
            </span>
          </div>
        </div>
        <div className="p-5 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-text-muted mb-2">
            Active Members
          </div>
          <div className="text-3xl font-bold flex items-end gap-2 text-text">
            12{" "}
            <span className="text-xs text-text-muted mb-1.5 font-semibold bg-muted px-1.5 py-0.5 rounded-md border border-border">
              Same
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl p-6 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm font-semibold text-text">Velocity Chart</div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>{" "}
              Completed
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted border border-border"></span>{" "}
              Planned
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-end gap-3 md:gap-6 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
            <div className="border-t border-text w-full"></div>
            <div className="border-t border-text w-full"></div>
            <div className="border-t border-text w-full"></div>
            <div className="border-t border-text w-full"></div>
          </div>
          {/* Bars */}
          {[
            { p: 40, c: 35 },
            { p: 55, c: 50 },
            { p: 30, c: 35 },
            { p: 70, c: 65 },
            { p: 45, c: 45 },
            { p: 80, c: 75 },
            { p: 60, c: 65 },
            { p: 90, c: 80 },
          ].map((v, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end h-full gap-1.5 group relative"
            >
              <div className="w-full flex justify-center gap-1 items-end h-full">
                <div
                  className="w-1/2 bg-muted border border-border/50 rounded-t-sm"
                  style={{ height: `${v.p}%` }}
                ></div>
                <div
                  className="w-1/2 bg-primary/80 group-hover:bg-primary transition-colors rounded-t-sm relative shadow-[0_0_10px_rgba(var(--color-primary),0.3)]"
                  style={{ height: `${v.c}%` }}
                >
                  <div
                    className="absolute top-0 w-full bg-primary-hover rounded-t-sm"
                    style={{ height: "4px" }}
                  ></div>
                </div>
              </div>
              <div className="text-[10px] font-medium text-text-muted text-center mt-1">
                W{i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

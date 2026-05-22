import { FileText } from "lucide-react";
import type { RequirementsSummaryProps } from "@/types/components/RequirementsTypes";

export function RequirementsSummary({
  frCount,
  nfrCount,
  totalRequirements,
}: RequirementsSummaryProps) {
  const summaryItems = [
    {
      label: "Total Requirements",
      value: totalRequirements,
      icon: FileText,
      color: "text-primary",
    },
    {
      label: "Functional (FR)",
      value: frCount,
      icon: FileText,
      color: "text-blue-500",
    },
    {
      label: "Non-Functional (NFR)",
      value: nfrCount,
      icon: FileText,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
      {summaryItems.map((item) => (
        <div
          key={item.label}
          className="bg-card border border-border rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest mb-3">
            <item.icon className={`w-4 h-4 ${item.color}`} /> {item.label}
          </div>
          <div className="flex items-end gap-2">
            <h4 className="text-4xl font-extrabold text-text">{item.value}</h4>
          </div>
        </div>
      ))}
    </div>
  );
}

import React from "react";
import { ChevronDown, Target, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function PlanningTable({
  plannings,
  openMenuId,
  setOpenMenuId,
  setMenuPosition,
  menuPosition,
  mounted,
  onEdit,
  onDelete,
}: any) {
  const getStatusMap = (status: string): any => {
    if (status === "In Progress") return "in_progress";
    if (status === "Done") return "done";
    return "todo";
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-text-muted border-b border-border">
            <tr>
              <th className="px-6 py-5 font-bold border-r border-border/50 w-32 border-b-2 border-b-border/80">
                <div className="flex items-center gap-2 cursor-pointer hover:text-text">
                  ID Backlog
                </div>
              </th>
              <th className="px-6 py-5 font-bold cursor-pointer hover:text-text border-r border-border/50 border-b-2 border-b-border/80 min-w-50">
                Fitur yang Dikerjakan
              </th>
              <th className="px-6 py-5 font-bold text-center w-48 border-r border-border/50 border-b-2 border-b-border/80">
                Penanggung Jawab
              </th>
              <th className="px-6 py-5 font-bold min-w-100 border-b-2 border-b-border/80">
                <div className="flex items-center gap-2">
                  Output yang Diharapkan{" "}
                  <span className="text-xs bg-muted text-text-muted px-2 py-0.5 rounded font-medium border border-border/50">
                    Acceptance Criteria
                  </span>
                </div>
              </th>
              <th className="px-6 py-5 w-32 border-b-2 border-b-border/80">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {plannings.map((item: any) => (
              <tr
                key={item.id}
                className={cn(
                  "hover:bg-muted/50 transition-colors group relative",
                  openMenuId === item.id && "z-40 shadow-sm",
                )}
              >
                <td className="px-6 py-6 font-bold text-text-muted border-r border-border/50 bg-muted/5">
                  {item.id}
                </td>
                <td className="px-6 py-6 font-semibold text-text group-hover:text-primary transition-colors cursor-pointer border-r border-border/50">
                  <div className="flex items-center justify-between gap-4">
                    <span className="whitespace-normal leading-relaxed">
                      {item.featureName}
                    </span>
                    <Badge variant="status" value={getStatusMap(item.status)} />
                  </div>
                </td>
                <td className="px-6 py-6 border-r border-border/50">
                  <button className="w-full flex items-center justify-between gap-2 bg-background border border-border hover:border-primary/50 transition-colors px-3 py-1.5 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary-foreground border border-secondary/30">
                        {item.avatar}
                      </div>
                      <span className="font-semibold text-text text-xs">
                        {item.assignedUser}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-text-muted" />
                  </button>
                </td>
                <td className="px-6 py-6 text-text-muted text-sm whitespace-normal max-w-xl leading-relaxed">
                  <ul className="list-disc pl-4 space-y-1 marker:text-border">
                    {Array.isArray(item.expectedOutput) ? (
                      item.expectedOutput.map((out: string, idx: number) => (
                        <li key={idx}>{out}</li>
                      ))
                    ) : (
                      <li>{item.expectedOutput}</li>
                    )}
                  </ul>
                </td>
                <td className="px-6 py-5 text-right align-top">
                  <div className="flex flex-col gap-2 relative z-10 w-full">
                    <Button
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="w-full bg-primary hover:bg-primary-hover text-primary-foreground opacity-100 shadow-sm"
                      leftIcon={<Edit2 className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(item.id)}
                      className="w-full bg-priority-urgent hover:bg-priority-urgent/90 text-primary-foreground opacity-100 shadow-sm"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Hapus
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {plannings.length === 0 && (
          <div className="py-20 text-center text-text-muted flex flex-col items-center justify-center w-full">
            <Target className="w-12 h-12 mb-4 text-border" />
            <p className="font-semibold text-text">
              Belum ada backlog yang dipindahkan ke Planning.
            </p>
            <p className="text-sm">
              Silakan pilih tiket dari tab Backlog untuk merencanakan siklus
              ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

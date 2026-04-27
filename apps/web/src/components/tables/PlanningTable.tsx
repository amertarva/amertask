import {
  ChevronDown,
  Target,
  Edit2,
  Trash2,
  Play,
  Calendar,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { IssueStatus } from "@/types";
import { type PlanningTableProps } from "@/types/components/PlanningTableTypes";

export function PlanningTable({
  plannings,
  teamSlug,
  onEdit,
  onDelete,
  onPromote,
}: PlanningTableProps) {
  const getStatusMap = (status: string): IssueStatus => {
    if (status === "In Progress") return "in_progress";
    if (status === "In Execution") return "in_progress";
    if (status === "Done") return "done";
    if (status === "Cancelled") return "cancelled";
    return "todo";
  };

  const formatSchedule = (
    startDate?: string,
    dueDate?: string,
    estimatedHours?: number,
  ) => {
    if (!startDate && !dueDate && !estimatedHours) {
      return null;
    }

    const parts = [];

    if (startDate && dueDate) {
      const start = new Date(startDate);
      const end = new Date(dueDate);
      const days = differenceInDays(end, start) + 1;

      parts.push({
        icon: Calendar,
        text: `${format(start, "d MMM", { locale: localeId })} - ${format(end, "d MMM", { locale: localeId })}`,
        subtext: `${days} hari`,
      });
    } else if (startDate) {
      parts.push({
        icon: Calendar,
        text: format(new Date(startDate), "d MMM yyyy", { locale: localeId }),
        subtext: "Mulai",
      });
    } else if (dueDate) {
      parts.push({
        icon: Calendar,
        text: format(new Date(dueDate), "d MMM yyyy", { locale: localeId }),
        subtext: "Target",
      });
    }

    if (estimatedHours && estimatedHours > 0) {
      const workDays = Math.ceil(estimatedHours / 8);
      parts.push({
        icon: Clock,
        text: `${estimatedHours}h`,
        subtext: `~${workDays} hari kerja`,
      });
    }

    return parts;
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
              <th className="px-6 py-5 font-bold w-56 border-r border-border/50 border-b-2 border-b-border/80">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Jadwal & Estimasi
                </div>
              </th>
              <th className="px-6 py-5 font-bold min-w-100 border-b-2 border-b-border/80">
                <div className="flex items-center gap-2">
                  Output yang Diharapkan{" "}
                </div>
              </th>
              <th className="px-6 py-5 w-32 border-b-2 border-b-border/80">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {plannings.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "hover:bg-muted/50 transition-colors group relative",
                  (item.status === "In Execution" ||
                    item.status === "Done" ||
                    item.status === "Cancelled") &&
                    "opacity-60",
                )}
              >
                <td className="px-6 py-6 font-bold text-text-muted border-r border-border/50 bg-muted/5">
                  {teamSlug?.toUpperCase()}-
                  {String(item.number).padStart(3, "0")}
                </td>
                <td className="px-6 py-6 font-semibold text-text group-hover:text-primary transition-colors cursor-pointer border-r border-border/50">
                  <div className="flex items-center justify-between gap-4">
                    <span className="whitespace-normal leading-relaxed">
                      {item.featureName}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="status"
                        value={getStatusMap(item.status)}
                      />
                    </div>
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
                <td className="px-6 py-6 border-r border-border/50">
                  {(() => {
                    const schedule = formatSchedule(
                      item.startDate,
                      item.dueDate,
                      item.estimatedHours,
                    );

                    if (!schedule) {
                      return (
                        <div className="text-xs text-text-muted italic">
                          Belum dijadwalkan
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {schedule.map((part, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs"
                          >
                            <part.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-semibold text-text">
                                {part.text}
                              </span>
                              <span className="text-text-muted text-[10px]">
                                {part.subtext}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
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
                  {item.status === "In Execution" ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-xs text-text-muted bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-center">
                        <div className="font-semibold text-status-done mb-1">
                          Sedang Dieksekusi
                        </div>
                        <div className="text-[10px]">
                          Lihat di tab Execution
                        </div>
                      </div>
                    </div>
                  ) : item.status === "Done" ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-xs text-text-muted bg-status-done/10 border border-status-done/30 rounded-lg px-4 py-3 text-center">
                        <div className="font-semibold text-status-done mb-1">
                          ✓ Selesai
                        </div>
                        <div className="text-[10px]">
                          Planning telah selesai
                        </div>
                      </div>
                    </div>
                  ) : item.status === "Cancelled" ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-xs text-text-muted bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-center">
                        <div className="font-semibold text-text-muted mb-1">
                          ✕ Dibatalkan
                        </div>
                        <div className="text-[10px]">Planning tidak jadi</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end relative z-10 w-full">
                      <Dropdown
                        align="right"
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        }
                        items={[
                          {
                            label: "Mulai Eksekusi",
                            icon: <Play className="w-4 h-4" />,
                            onClick: () => onPromote(item),
                          },
                          {
                            label: "Edit",
                            icon: <Edit2 className="w-4 h-4" />,
                            onClick: () => onEdit(item),
                          },
                          { divider: true },
                          {
                            label: "Hapus",
                            icon: <Trash2 className="w-4 h-4" />,
                            danger: true,
                            onClick: () => onDelete(item.id),
                          },
                        ]}
                      />
                    </div>
                  )}
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

import React from "react";
import {
  Clock,
  Edit2,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Ban,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function ExecutionTable({
  executions,
  openMenuId,
  setOpenMenuId,
  menuPosition,
  setMenuPosition,
  onEdit,
  onMarkBlocked,
  onMarkCancelled,
  onDelete,
  onAdvanceStatus,
  mounted,
}: any) {
  const getExecutionStatusMap = (status: string): any => {
    switch (status) {
      case "TO DO":
        return "todo";
      case "SELESAI":
        return "done";
      case "PROSES":
        return "in_progress";
      case "REVIEW":
        return "in_review";
      case "TERKENDALA":
        return "bug";
      case "CANCELLED":
        return "cancelled";
      default:
        return "todo";
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
      <div className="overflow-x-auto h-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-text-muted border-b border-border">
            <tr>
              <th className="px-6 py-5 font-bold border-r border-border/50 w-16 text-center border-b-2 border-b-border/80">
                No
              </th>
              <th className="px-6 py-5 font-bold cursor-pointer hover:text-text border-r border-border/50 border-b-2 border-b-border/80 min-w-75">
                Aktivitas & Kaitan
              </th>
              <th className="px-6 py-5 font-bold border-r border-border/50 border-b-2 border-b-border/80">
                Waktu / Tanggal
              </th>
              <th className="px-6 py-5 font-bold text-center w-48 border-r border-border/50 border-b-2 border-b-border/80">
                Penanggung Jawab
              </th>
              <th className="px-6 py-5 font-bold border-r border-border/50 border-b-2 border-b-border/80">
                Status
              </th>
              <th className="px-6 py-5 font-bold min-w-75 border-b-2 border-b-border/80">
                Catatan Eksekusi
              </th>
              <th className="px-6 py-5 w-32 border-b-2 border-b-border/80">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {executions.map((item: any) => (
              <tr
                key={item.no}
                className={cn(
                  "hover:bg-muted/50 transition-colors group relative",
                  openMenuId === item.no && "z-40 shadow-sm",
                )}
              >
                <td className="px-6 py-5 font-bold text-text-muted text-center border-r border-border/50 bg-background/50">
                  {item.no}
                </td>
                <td className="px-6 py-5 border-r border-border/50">
                  <span className="font-semibold text-text block mb-1 group-hover:text-primary transition-colors cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis max-w-70 lg:max-w-md">
                    {item.activity}
                  </span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-muted px-2 py-0.5 rounded border border-border inline-flex items-center gap-1">
                    Ref: {item.taskId}
                  </span>
                </td>
                <td className="px-6 py-5 border-r border-border/50 text-text-muted">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-subtle" />
                    <span className="font-medium text-xs">{item.date}</span>
                  </div>
                </td>
                <td className="px-6 py-5 border-r border-border/50">
                  <div className="flex items-center justify-center gap-2 cursor-pointer hover:bg-background border border-transparent hover:border-border transition-colors px-2 py-1.5 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary-foreground border border-secondary/30">
                      {item.avatar}
                    </div>
                    <span className="font-semibold text-text text-xs">
                      {item.assignedUser}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 border-r border-border/50">
                  <Badge
                    variant="status"
                    value={getExecutionStatusMap(item.status)}
                  />
                </td>
                <td className="px-6 py-5 text-text-muted text-xs md:text-sm whitespace-normal max-w-sm leading-relaxed font-medium">
                  {item.notes}
                </td>
                <td className="px-6 py-5 text-right align-top">
                  <div className="flex flex-col gap-2 relative z-10 w-full">
                    {!["SELESAI", "TERKENDALA", "CANCELLED"].includes(
                      item.status,
                    ) && (
                      <Button
                        size="sm"
                        onClick={() => onAdvanceStatus(item.no, item.status)}
                        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground opacity-100 shadow-sm"
                        leftIcon={
                          item.status === "TO DO" ? (
                            <PlayCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )
                        }
                      >
                        {item.status === "TO DO" ? "Mulai" : "Selesai"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="w-full bg-primary hover:bg-primary-hover text-primary-foreground opacity-100 shadow-sm"
                      leftIcon={<Edit2 className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                    {item.status !== "TERKENDALA" && (
                      <Button
                        size="sm"
                        onClick={() => onMarkBlocked(item.no)}
                        className="w-full bg-priority-high hover:bg-priority-high/90 text-primary-foreground opacity-100 shadow-sm"
                        leftIcon={<AlertCircle className="w-4 h-4" />}
                      >
                        Terkendala
                      </Button>
                    )}
                    {item.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        onClick={() => onMarkCancelled(item.no)}
                        className="w-full bg-status-cancelled hover:bg-status-cancelled/90 text-primary-foreground opacity-100 shadow-sm"
                        leftIcon={<Ban className="w-4 h-4" />}
                      >
                        Cancelled
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(item.no)}
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
      </div>
    </div>
  );
}

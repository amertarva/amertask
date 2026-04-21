import React from "react";
import {
  ArrowUpDown,
  MoreHorizontal,
  Filter,
  Edit2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function BacklogTable({
  activeTab,
  products,
  priorities,
  openMenuId,
  setOpenMenuId,
  menuPosition,
  setMenuPosition,
  onEdit,
  onDelete,
  mounted,
}: any) {
  const getPriorityMap = (priority: string): any => {
    switch (priority) {
      case "TINGGI":
        return "urgent";
      case "SEDANG":
        return "high";
      case "RENDAH":
        return "low";
      default:
        return "medium";
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
      <div className="overflow-x-auto h-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-text-muted border-b border-border">
            <tr>
              <th className="px-6 py-4 font-bold border-r border-border/50 w-32">
                <div className="flex items-center gap-2 cursor-pointer hover:text-text">
                  ID <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-4 font-bold cursor-pointer hover:text-text border-r border-border/50">
                Nama Fitur
              </th>
              {activeTab === "product" && (
                <>
                  <th className="px-6 py-4 font-bold min-w-[300px] border-r border-border/50">
                    Deskripsi
                  </th>
                  <th className="px-6 py-4 font-bold text-center w-40 border-r border-border/50">
                    Pengguna
                  </th>
                </>
              )}

              {activeTab === "priority" && (
                <>
                  <th className="px-6 py-4 font-bold w-40 cursor-pointer hover:text-text border-r border-border/50">
                    Prioritas
                  </th>
                  <th className="px-6 py-4 font-bold min-w-[300px] border-r border-border/50">
                    Alasan Prioritas
                  </th>
                </>
              )}
              <th className="px-6 py-4 w-32 border-r border-border/50">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activeTab === "product" &&
              products.map((item: any) => (
                <tr
                  key={item.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors group relative",
                    openMenuId === item.id && "z-40 shadow-sm",
                  )}
                >
                  <td className="px-6 py-5 font-bold text-text-muted border-r border-border/50">
                    {item.id}
                  </td>
                  <td className="px-6 py-5 font-semibold text-text group-hover:text-primary transition-colors cursor-pointer border-r border-border/50">
                    {item.featureName}
                  </td>
                  <td className="px-6 py-5 text-text-muted text-xs md:text-sm whitespace-normal max-w-xs md:max-w-md leading-relaxed border-r border-border/50">
                    {item.description}
                  </td>
                  <td className="px-6 py-5 border-r border-border/50 text-center">
                    <span className="font-medium text-text-subtle text-xs bg-muted/60 px-3 py-1.5 rounded-lg whitespace-nowrap">
                      {item.targetUser}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center align-top border-r-0">
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

            {activeTab === "priority" &&
              priorities.map((item: any) => (
                <tr
                  key={item.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors group relative",
                    openMenuId === item.id && "z-40 shadow-sm",
                  )}
                >
                  <td className="px-6 py-5 font-bold text-text-muted border-r border-border/50">
                    {item.id}
                  </td>
                  <td className="px-6 py-5 font-semibold text-text group-hover:text-primary transition-colors cursor-pointer border-r border-border/50">
                    {item.featureName}
                  </td>
                  <td className="px-6 py-5 border-r border-border/50">
                    <Badge
                      variant="priority"
                      value={getPriorityMap(item.priority)}
                    />
                  </td>
                  <td className="px-6 py-5 text-text-muted text-xs md:text-sm whitespace-normal max-w-xs md:max-w-md leading-relaxed border-r border-border/50">
                    {item.reason}
                  </td>
                  <td className="px-6 py-5 text-center align-top border-r-0">
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

        {((activeTab === "product" && products.length === 0) ||
          (activeTab === "priority" && priorities.length === 0)) && (
          <div className="py-24 text-center text-text-muted flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-text-subtle" />
            </div>
            <h3 className="text-lg font-bold text-text mb-1">Backlog Kosong</h3>
            <p className="text-sm">
              Tidak ada data tambahan pada kategori ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

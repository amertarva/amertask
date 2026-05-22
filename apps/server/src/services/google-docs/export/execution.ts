import type { ExecutionItem } from "../../../types/services/docs/types";
import { toIndonesianDateTime, toIndonesianDate, fmtStatus } from "../utils";
import { writeSectionToDoc } from "./section-writer";

export async function exportExecution(
  documentId: string,
  items: ExecutionItem[],
  teamName: string,
): Promise<void> {
  const updatedAt = toIndonesianDateTime();
  const headerRow = [
    "No",
    "Task ID",
    "Aktivitas",
    "Ditugaskan ke",
    "Status",
    "Tgl Update",
    "Catatan",
  ];

  const dataRows = items.map((item, idx) => [
    String(idx + 1),
    `${item.teamSlug}-${item.number}`,
    item.title ?? "",
    item.assignedUser ?? "Unassigned",
    fmtStatus(item.status),
    toIndonesianDate(item.updatedAt),
    item.notes ?? "Tidak ada catatan",
  ]);

  const columnWidths = [24, 54, 110, 72, 54, 64, 90];

  await writeSectionToDoc({
    documentId,
    exportType: "execution",
    headerRow,
    dataRows,
    columnWidths,
    sectionTitle: `Execution - ${teamName}`,
    sectionSubtitle: `Diperbarui: ${updatedAt} | Total: ${items.length} aktivitas`,
  });
}

import type { PlanningItem } from "../../../types/services/docs/types";
import { toIndonesianDateTime, toIndonesianDate } from "../utils";
import { writeSectionToDoc } from "./section-writer";

export async function exportPlanning(
  documentId: string,
  items: PlanningItem[],
  teamName: string,
): Promise<void> {
  const updatedAt = toIndonesianDateTime();
  const headerRow = [
    "No",
    "ID Backlog",
    "Fitur yang Dikerjakan",
    "Penanggung Jawab",
    "Jadwal & Estimasi",
    "Output yang Diharapkan",
  ];

  const dataRows = items.map((item, idx) => {
    let scheduleText = "-";
    if (item.startDate && item.dueDate) {
      const start = toIndonesianDate(item.startDate);
      const end = toIndonesianDate(item.dueDate);
      scheduleText = `${start} - ${end}`;

      if (item.estimatedHours && item.estimatedHours > 0) {
        scheduleText += `\n(Est: ${item.estimatedHours} jam)`;
      }
    } else if (item.estimatedHours && item.estimatedHours > 0) {
      scheduleText = `Estimasi: ${item.estimatedHours} jam`;
    }

    return [
      String(idx + 1),
      `${item.teamSlug.toUpperCase()}-${item.number}`,
      item.title ?? "",
      item.assignedUser ?? "Belum ditugaskan",
      scheduleText,
      item.planInfo ?? "Belum ada deskripsi output",
    ];
  });

  const columnWidths = [30, 70, 140, 90, 100, 140];

  await writeSectionToDoc({
    documentId,
    exportType: "planning",
    headerRow,
    dataRows,
    columnWidths,
    sectionTitle: `Sprint Planning - ${teamName}`,
    sectionSubtitle: `Diperbarui: ${updatedAt} | Total: ${items.length} task`,
  });
}

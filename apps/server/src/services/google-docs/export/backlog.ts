import type { BacklogItem } from "../../../types/services/docs/types";
import { MARKERS, BACKLOG_SUBSECTION_MARKERS } from "../constants";
import { toIndonesianDateTime, fmtPriority } from "../utils";
import { getDocsClient, ensureSectionMarkers } from "../document";
import { writeSubsectionToDoc } from "./subsection-writer";

export async function exportBacklog(
  documentId: string,
  items: BacklogItem[],
  teamName: string,
): Promise<void> {
  const docs = await getDocsClient();
  const updatedAt = toIndonesianDateTime();

  const mainMarkers = MARKERS.backlog;
  await ensureSectionMarkers({
    docs,
    documentId,
    startMarker: mainMarkers.start,
    endMarker: mainMarkers.end,
  });

  const productItems = items;
  const priorityItems = items.filter((item) => {
    const priority = String(item.priority || "").toLowerCase();
    return ["urgent", "high", "medium", "low"].includes(priority);
  });

  const productHeader = ["No", "ID", "Nama Fitur", "Deskripsi", "Target User"];
  const productRows = productItems.map((item, idx) => [
    String(idx + 1),
    `${item.teamSlug}-${item.number}`,
    item.title ?? "",
    item.description ?? "-",
    item.targetUser ?? "Belum ditentukan",
  ]);
  const productWidths = [24, 54, 130, 180, 80];

  await writeSubsectionToDoc({
    documentId,
    startMarker: BACKLOG_SUBSECTION_MARKERS.productStart,
    endMarker: BACKLOG_SUBSECTION_MARKERS.productEnd,
    parentStartMarker: mainMarkers.start,
    parentEndMarker: mainMarkers.end,
    headerRow: productHeader,
    dataRows: productRows,
    columnWidths: productWidths,
    sectionTitle: `Product Backlog - ${teamName}`,
    sectionSubtitle: `Diperbarui: ${updatedAt} | Total: ${productItems.length} item`,
  });

  if (priorityItems.length > 0) {
    const priorityHeader = ["No", "ID", "Nama Fitur", "Prioritas", "Alasan"];
    const priorityRows = priorityItems.map((item, idx) => [
      String(idx + 1),
      `${item.teamSlug}-${item.number}`,
      item.title ?? "",
      fmtPriority(item.priority),
      item.reason ?? "Tidak ada alasan tercatat",
    ]);
    const priorityWidths = [24, 54, 130, 60, 200];

    await writeSubsectionToDoc({
      documentId,
      startMarker: BACKLOG_SUBSECTION_MARKERS.priorityStart,
      endMarker: BACKLOG_SUBSECTION_MARKERS.priorityEnd,
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      headerRow: priorityHeader,
      dataRows: priorityRows,
      columnWidths: priorityWidths,
      sectionTitle: `Priority Backlog - ${teamName}`,
      sectionSubtitle: `${priorityItems.length} item dengan prioritas`,
    });
  }
}

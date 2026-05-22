import type { RequirementItem } from "../../../types/services/docs/types";
import { MARKERS } from "../constants";
import { fmtPriority } from "../utils";
import { getDocsClient, ensureSectionMarkers } from "../document";
import { writeSubsectionToDoc } from "./subsection-writer";

export async function exportRequirements(
  documentId: string,
  requirements: RequirementItem[],
  teamName: string,
  teamSlug?: string,
): Promise<void> {
  const docs = await getDocsClient();
  const mainMarkers = MARKERS.requirements;

  await ensureSectionMarkers({
    docs,
    documentId,
    startMarker: mainMarkers.start,
    endMarker: mainMarkers.end,
  });

  const headerRow = [
    "No",
    "Type",
    "Deskripsi",
    "Prioritas",
    "Acceptance Criteria",
    "Kategori NFR",
  ];
  const columnWidths = [24, 40, 150, 60, 120, 80];

  const grouped: Record<
    string,
    {
      issue: { id: string; number: number; title: string } | null;
      reqs: RequirementItem[];
    }
  > = {};
  for (const req of requirements) {
    const key = req.issue?.id || "unassigned";
    if (!grouped[key]) {
      grouped[key] = { issue: req.issue || null, reqs: [] };
    }
    grouped[key].reqs.push(req);
  }

  const sortedGroups = Object.values(grouped).sort((a, b) => {
    if (!a.issue) return 1;
    if (!b.issue) return -1;
    return a.issue.number - b.issue.number;
  });

  const prefix = teamSlug ? teamSlug.toUpperCase() : "TASK";

  for (const group of sortedGroups) {
    const issue = group.issue;
    const startMarker = issue
      ? `[TASKOPS-REQ-ISSUE-${issue.number}-START]`
      : `[TASKOPS-REQ-UNASSIGNED-START]`;
    const endMarker = issue
      ? `[TASKOPS-REQ-ISSUE-${issue.number}-END]`
      : `[TASKOPS-REQ-UNASSIGNED-END]`;
    const sectionTitle = issue
      ? `${prefix}-${String(issue.number).padStart(3, "0")} ${issue.title}`
      : `Requirement Lainnya`;

    const frItems = group.reqs.filter((item) => item.type === "FR");
    const nfrItems = group.reqs.filter((item) => item.type === "NFR");

    const dataRows: string[][] = [];

    group.reqs.forEach((item, idx) => {
      dataRows.push([
        String(idx + 1),
        item.type,
        item.description ?? "",
        fmtPriority(item.priority),
        item.acceptanceCriteria ?? "-",
        item.nfrCategory ?? (item.type === "FR" ? "-" : "Tidak dikategorikan"),
      ]);
    });

    await writeSubsectionToDoc({
      documentId,
      startMarker,
      endMarker,
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      headerRow,
      dataRows,
      columnWidths,
      sectionTitle,
      sectionSubtitle: `FR: ${frItems.length}, NFR: ${nfrItems.length}`,
    });
  }
}

import type { RequirementItem } from "../../../types/services/docs/types";
import { MARKERS } from "../constants";
import { fmtPriority } from "../utils";
import { getDocsClient, ensureSectionMarkers } from "../document";
import { writeSubsectionToDoc } from "./subsection-writer";
import { writeTextSubsection } from "./text-writer";

export async function exportSrs(
  documentId: string,
  srsDoc: any | null,
  requirements: RequirementItem[],
  teamName: string,
  teamSlug?: string,
): Promise<void> {
  const docs = await getDocsClient();
  const mainMarkers = MARKERS.srs;

  await ensureSectionMarkers({
    docs,
    documentId,
    startMarker: mainMarkers.start,
    endMarker: mainMarkers.end,
  });

  await exportSrsIntroduction(documentId, srsDoc, mainMarkers);
  await exportSrsGeneralDescription(documentId, srsDoc, mainMarkers);
  await exportSrsExternalInterfaces(documentId, srsDoc, mainMarkers);
  await exportSrsFunctionalRequirements(
    documentId,
    requirements,
    mainMarkers,
    teamSlug,
  );
}

async function exportSrsIntroduction(
  documentId: string,
  srsDoc: any,
  mainMarkers: { start: string; end: string },
): Promise<void> {
  if (srsDoc?.purpose) {
    await writeTextSubsection({
      documentId,
      startMarker: "[TASKOPS-SRS-PURPOSE-START]",
      endMarker: "[TASKOPS-SRS-PURPOSE-END]",
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      sectionTitle: "1.1 Tujuan Dokumen",
      content: srsDoc.purpose,
    });
  }

  if (srsDoc?.scope) {
    await writeTextSubsection({
      documentId,
      startMarker: "[TASKOPS-SRS-SCOPE-START]",
      endMarker: "[TASKOPS-SRS-SCOPE-END]",
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      sectionTitle: "1.2 Lingkup Produk",
      content: srsDoc.scope,
    });
  }

  if (
    srsDoc?.glossary &&
    Array.isArray(srsDoc.glossary) &&
    srsDoc.glossary.length > 0
  ) {
    const glossaryRows = srsDoc.glossary.map((item: any, idx: number) => [
      String(idx + 1),
      item.term || "",
      item.definition || "",
    ]);

    await writeSubsectionToDoc({
      documentId,
      startMarker: "[TASKOPS-SRS-GLOSSARY-START]",
      endMarker: "[TASKOPS-SRS-GLOSSARY-END]",
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      headerRow: ["No", "Istilah", "Definisi"],
      dataRows: glossaryRows,
      columnWidths: [30, 120, 310],
      sectionTitle: "1.3 Definisi & Akronim",
      sectionSubtitle: `${srsDoc.glossary.length} istilah`,
    });
  }
}

async function exportSrsGeneralDescription(
  documentId: string,
  srsDoc: any,
  mainMarkers: { start: string; end: string },
): Promise<void> {
  if (srsDoc?.product_perspective) {
    await writeTextSubsection({
      documentId,
      startMarker: "[TASKOPS-SRS-PRODUCT-PERSPECTIVE-START]",
      endMarker: "[TASKOPS-SRS-PRODUCT-PERSPECTIVE-END]",
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      sectionTitle: "2.1 Perspektif Produk",
      content: srsDoc.product_perspective,
    });
  }

  if (srsDoc?.product_functions) {
    await writeTextSubsection({
      documentId,
      startMarker: "[TASKOPS-SRS-PRODUCT-FUNCTIONS-START]",
      endMarker: "[TASKOPS-SRS-PRODUCT-FUNCTIONS-END]",
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      sectionTitle: "2.2 Fungsi Produk",
      content: srsDoc.product_functions,
    });
  }

  if (
    srsDoc?.user_characteristics &&
    Array.isArray(srsDoc.user_characteristics) &&
    srsDoc.user_characteristics.length > 0
  ) {
    const userRows = srsDoc.user_characteristics.map(
      (item: any, idx: number) => [
        String(idx + 1),
        item.role || "",
        item.description || "",
      ],
    );

    await writeSubsectionToDoc({
      documentId,
      startMarker: "[TASKOPS-SRS-USER-CHARS-START]",
      endMarker: "[TASKOPS-SRS-USER-CHARS-END]",
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      headerRow: ["No", "Role", "Deskripsi"],
      dataRows: userRows,
      columnWidths: [30, 120, 310],
      sectionTitle: "2.3 Karakteristik Pengguna",
      sectionSubtitle: `${srsDoc.user_characteristics.length} role`,
    });
  }

  if (srsDoc?.general_constraints) {
    await writeTextSubsection({
      documentId,
      startMarker: "[TASKOPS-SRS-CONSTRAINTS-START]",
      endMarker: "[TASKOPS-SRS-CONSTRAINTS-END]",
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      sectionTitle: "2.4 Batasan Umum",
      content: srsDoc.general_constraints,
    });
  }
}

async function exportSrsExternalInterfaces(
  documentId: string,
  srsDoc: any,
  mainMarkers: { start: string; end: string },
): Promise<void> {
  if (srsDoc?.ui_requirements) {
    await writeTextSubsection({
      documentId,
      startMarker: "[TASKOPS-SRS-UI-START]",
      endMarker: "[TASKOPS-SRS-UI-END]",
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      sectionTitle: "3.1 User Interface",
      content: srsDoc.ui_requirements,
    });
  }

  if (srsDoc?.hardware_interface) {
    await writeTextSubsection({
      documentId,
      startMarker: "[TASKOPS-SRS-HARDWARE-START]",
      endMarker: "[TASKOPS-SRS-HARDWARE-END]",
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      sectionTitle: "3.2 Hardware Interface",
      content: srsDoc.hardware_interface,
    });
  }

  if (srsDoc?.software_interface) {
    await writeTextSubsection({
      documentId,
      startMarker: "[TASKOPS-SRS-SOFTWARE-START]",
      endMarker: "[TASKOPS-SRS-SOFTWARE-END]",
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      sectionTitle: "3.3 Software Interface",
      content: srsDoc.software_interface,
    });
  }

  if (srsDoc?.comm_interface) {
    await writeTextSubsection({
      documentId,
      startMarker: "[TASKOPS-SRS-COMM-START]",
      endMarker: "[TASKOPS-SRS-COMM-END]",
      parentStartMarker: mainMarkers.start,
      parentEndMarker: mainMarkers.end,
      sectionTitle: "3.4 Communication Interface",
      content: srsDoc.comm_interface,
    });
  }
}

async function exportSrsFunctionalRequirements(
  documentId: string,
  requirements: RequirementItem[],
  mainMarkers: { start: string; end: string },
  teamSlug?: string,
): Promise<void> {
  const headerRow = [
    "ID",
    "Deskripsi Requirement",
    "Prioritas",
    "Acceptance Criteria",
  ];
  const columnWidths = [50, 200, 60, 150];

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
      ? `[TASKOPS-SRS-ISSUE-${issue.number}-START]`
      : `[TASKOPS-SRS-UNASSIGNED-START]`;
    const endMarker = issue
      ? `[TASKOPS-SRS-ISSUE-${issue.number}-END]`
      : `[TASKOPS-SRS-UNASSIGNED-END]`;
    const sectionTitle = issue
      ? `4. ${prefix}-${String(issue.number).padStart(3, "0")} ${issue.title}`
      : `4. Requirement Lainnya`;

    const frItems = group.reqs.filter((item) => item.type === "FR");
    const nfrItems = group.reqs.filter((item) => item.type === "NFR");

    const dataRows: string[][] = [];

    frItems.forEach((item, idx) => {
      dataRows.push([
        `FR-${idx + 1}`,
        item.description ?? "",
        fmtPriority(item.priority),
        item.acceptanceCriteria ?? "Belum didefinisikan",
      ]);
    });

    nfrItems.forEach((item, idx) => {
      dataRows.push([
        `NFR-${idx + 1}`,
        `[${item.nfrCategory ?? "General"}] ${item.description ?? ""}`,
        fmtPriority(item.priority),
        item.acceptanceCriteria ?? "Belum didefinisikan",
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

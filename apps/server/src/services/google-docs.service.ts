import type { docs_v1 } from "@googleapis/docs";

let _docsApi: typeof import("@googleapis/docs").docs | null = null;
let _GoogleAuth: typeof import("google-auth-library").GoogleAuth | null = null;

async function loadGoogleDeps() {
  if (!_docsApi) {
    const docsModule = await import("@googleapis/docs");
    _docsApi = docsModule.docs;
  }
  if (!_GoogleAuth) {
    const authModule = await import("google-auth-library");
    _GoogleAuth = authModule.GoogleAuth;
  }
  return { docsApi: _docsApi, GoogleAuth: _GoogleAuth };
}

export type ExportType = "planning" | "backlog" | "execution";

export interface PlanningItem {
  id: string;
  number: number;
  teamSlug: string;
  title: string;
  description?: string;
  planInfo?: string;
  assignedUser?: string;
  status: string;
  priority: string;
  createdBy?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
}

export interface BacklogItem {
  id: string;
  number: number;
  teamSlug: string;
  title: string;
  description?: string;
  targetUser?: string;
  priority: string;
  reason?: string;
}

export interface ExecutionItem {
  id: string;
  number: number;
  teamSlug: string;
  title: string;
  assignedUser?: string;
  status: string;
  notes?: string;
  updatedAt: string;
}

const MARKERS: Record<
  ExportType,
  {
    start: string;
    end: string;
  }
> = {
  planning: {
    start: "[TASKOPS-PLANNING-START]",
    end: "[TASKOPS-PLANNING-END]",
  },
  backlog: {
    start: "[TASKOPS-BACKLOG-START]",
    end: "[TASKOPS-BACKLOG-END]",
  },
  execution: {
    start: "[TASKOPS-EXECUTION-START]",
    end: "[TASKOPS-EXECUTION-END]",
  },
};

// Separate markers for backlog subsections
const BACKLOG_SUBSECTION_MARKERS = {
  productStart: "[TASKOPS-BACKLOG-PRODUCT-START]",
  productEnd: "[TASKOPS-BACKLOG-PRODUCT-END]",
  priorityStart: "[TASKOPS-BACKLOG-PRIORITY-START]",
  priorityEnd: "[TASKOPS-BACKLOG-PRIORITY-END]",
};

const TABLE_COLORS = {
  headerBg: { red: 0.102, green: 0.451, blue: 0.914 },
  headerText: { red: 1, green: 1, blue: 1 },
  rowAlt: { red: 0.91, green: 0.941, blue: 0.996 },
  rowNormal: { red: 1, green: 1, blue: 1 },
  border: { red: 0.827, green: 0.851, blue: 0.914 },
  titleText: { red: 0.067, green: 0.133, blue: 0.267 },
  subtitleText: { red: 0.4, green: 0.4, blue: 0.4 },
};

interface MarkerPosition {
  found: boolean;
  contentStartIndex: number;
  contentEndIndex: number;
}

interface ServiceAccountConfig {
  clientEmail: string;
  privateKey: string;
  projectId?: string;
}

function readServiceAccountConfig(): ServiceAccountConfig | null {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as {
        client_email?: string;
        private_key?: string;
        project_id?: string;
      };

      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key,
          projectId: parsed.project_id,
        };
      }
    } catch {
      console.error(
        "[google-docs] GOOGLE_SERVICE_ACCOUNT_JSON tidak valid. Pastikan format JSON benar.",
      );
      return null;
    }
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.GOOGLE_PROJECT_ID;

  if (!clientEmail || !privateKey) {
    return null;
  }

  return {
    clientEmail,
    privateKey,
    projectId,
  };
}

async function getDocsClient() {
  const serviceAccount = readServiceAccountConfig();
  if (!serviceAccount) {
    throw new Error(
      "Credential Google Docs belum lengkap. Isi GOOGLE_SERVICE_ACCOUNT_JSON atau GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY di environment variables.",
    );
  }

  const { docsApi, GoogleAuth } = await loadGoogleDeps();
  const auth = new GoogleAuth({
    credentials: {
      client_email: serviceAccount.clientEmail,
      private_key: serviceAccount.privateKey,
      project_id: serviceAccount.projectId,
    },
    scopes: ["https://www.googleapis.com/auth/documents"],
  });

  return docsApi({ version: "v1", auth });
}

function toIndonesianDateTime(value: Date = new Date()) {
  return value.toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function toIndonesianDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeCellText(value: string) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function normalizeRows(headerRow: string[], dataRows: string[][]) {
  const columnCount = headerRow.length;
  const allRows = [headerRow, ...dataRows].map((row) =>
    Array.from({ length: columnCount }, (_, idx) =>
      normalizeCellText(String(row[idx] ?? "")),
    ),
  );

  return allRows;
}

function extractParagraphText(element: docs_v1.Schema$StructuralElement) {
  const paragraphElements = element.paragraph?.elements ?? [];
  return paragraphElements
    .map((paragraphElement) => paragraphElement.textRun?.content ?? "")
    .join("");
}

function findMarkerPositions(
  content: docs_v1.Schema$StructuralElement[],
  startMarker: string,
  endMarker: string,
): MarkerPosition {
  let contentStartIndex = -1;
  let contentEndIndex = -1;

  for (const element of content) {
    if (!element.paragraph) continue;

    const text = extractParagraphText(element).trim();
    if (text === startMarker && contentStartIndex === -1) {
      contentStartIndex = element.endIndex ?? -1;
      continue;
    }

    if (text === endMarker && contentStartIndex !== -1) {
      contentEndIndex = element.startIndex ?? -1;
      break;
    }
  }

  return {
    found: contentStartIndex >= 0 && contentEndIndex >= contentStartIndex,
    contentStartIndex,
    contentEndIndex,
  };
}

function getBodyEndIndex(content: docs_v1.Schema$StructuralElement[]) {
  const lastElement = content[content.length - 1];
  return Math.max(1, (lastElement?.endIndex ?? 2) - 1);
}

function getTableElements(content: docs_v1.Schema$StructuralElement[]) {
  return content.filter((element) => !!element.table);
}

function getTableColumnCount(tableElement: docs_v1.Schema$StructuralElement) {
  const firstRow = tableElement.table?.tableRows?.[0];
  return firstRow?.tableCells?.length ?? 0;
}

function selectTableIndex(params: {
  content: docs_v1.Schema$StructuralElement[];
  minStartIndex: number;
  expectedRows: number;
  expectedCols: number;
}) {
  const { content, minStartIndex, expectedRows, expectedCols } = params;
  const tables = getTableElements(content);
  if (tables.length === 0) return -1;

  const exactMatchIdx = tables.findIndex((table) => {
    const startIndex = table.startIndex ?? 0;
    const rows = table.table?.tableRows?.length ?? 0;
    const cols = getTableColumnCount(table);

    return (
      startIndex >= minStartIndex &&
      rows === expectedRows &&
      cols === expectedCols
    );
  });

  if (exactMatchIdx >= 0) {
    return exactMatchIdx;
  }

  const nearestAfterIdx = tables.findIndex(
    (table) => (table.startIndex ?? 0) >= minStartIndex,
  );

  if (nearestAfterIdx >= 0) {
    return nearestAfterIdx;
  }

  return tables.length - 1;
}

function extractCellMatrixFromTable(
  tableElement: docs_v1.Schema$StructuralElement,
) {
  const rows = tableElement.table?.tableRows ?? [];
  const matrix: number[][] = [];

  for (const row of rows) {
    const cols: number[] = [];
    for (const cell of row.tableCells ?? []) {
      const firstParagraph = (cell.content ?? []).find(
        (entry) => !!entry.paragraph,
      );

      const paragraphStartIndex = firstParagraph?.startIndex ?? null;
      const paragraphEndIndex = firstParagraph?.endIndex ?? null;
      const cellStartIndex = cell.startIndex ?? null;
      const cellEndIndex = cell.endIndex ?? null;

      if (
        paragraphStartIndex !== null &&
        paragraphEndIndex !== null &&
        paragraphEndIndex > paragraphStartIndex
      ) {
        // Insert before paragraph trailing newline to keep location valid.
        cols.push(paragraphEndIndex - 1);
        continue;
      }

      if (
        cellStartIndex !== null &&
        cellEndIndex !== null &&
        cellEndIndex > cellStartIndex
      ) {
        cols.push(cellEndIndex - 1);
        continue;
      }

      cols.push(0);
    }
    matrix.push(cols);
  }

  return matrix;
}

function buildTableBorderStyle(): docs_v1.Schema$TableCellBorder {
  return {
    color: {
      color: {
        rgbColor: TABLE_COLORS.border,
      },
    },
    width: {
      magnitude: 0.75,
      unit: "PT",
    },
    dashStyle: "SOLID",
  };
}

function buildHeadingRequests(
  insertIndex: number,
  title: string,
  subtitle: string,
): { requests: docs_v1.Schema$Request[]; textLength: number } {
  const safeTitle = String(title || "").trim();
  const safeSubtitle = String(subtitle || "").trim();

  const fullText = safeSubtitle
    ? `${safeTitle}\n${safeSubtitle}\n`
    : `${safeTitle}\n`;

  const requests: docs_v1.Schema$Request[] = [
    {
      insertText: {
        location: { index: insertIndex },
        text: fullText,
      },
    },
    {
      updateParagraphStyle: {
        range: {
          startIndex: insertIndex,
          endIndex: insertIndex + safeTitle.length,
        },
        paragraphStyle: {
          namedStyleType: "HEADING_2",
        },
        fields: "namedStyleType",
      },
    },
    {
      updateTextStyle: {
        range: {
          startIndex: insertIndex,
          endIndex: insertIndex + safeTitle.length,
        },
        textStyle: {
          bold: true,
          fontSize: { magnitude: 14, unit: "PT" },
          foregroundColor: {
            color: { rgbColor: TABLE_COLORS.titleText },
          },
        },
        fields: "bold,fontSize,foregroundColor",
      },
    },
  ];

  if (safeSubtitle) {
    const subtitleStart = insertIndex + safeTitle.length + 1;
    const subtitleEnd = subtitleStart + safeSubtitle.length;

    requests.push({
      updateTextStyle: {
        range: {
          startIndex: subtitleStart,
          endIndex: subtitleEnd,
        },
        textStyle: {
          italic: true,
          fontSize: { magnitude: 9, unit: "PT" },
          foregroundColor: {
            color: { rgbColor: TABLE_COLORS.subtitleText },
          },
        },
        fields: "italic,fontSize,foregroundColor",
      },
    });
  }

  return {
    requests,
    textLength: fullText.length,
  };
}

function buildColumnWidthRequests(params: {
  tableStartIndex: number;
  columnCount: number;
  widths: number[];
}): docs_v1.Schema$Request[] {
  const { tableStartIndex, columnCount, widths } = params;
  const requests: docs_v1.Schema$Request[] = [];

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
    const width = Number(widths[columnIndex] ?? 0);
    if (!Number.isFinite(width) || width <= 0) continue;

    requests.push({
      updateTableColumnProperties: {
        tableStartLocation: { index: tableStartIndex },
        columnIndices: [columnIndex],
        tableColumnProperties: {
          widthType: "FIXED_WIDTH",
          width: {
            magnitude: width,
            unit: "PT",
          },
        },
        fields: "widthType,width",
      },
    });
  }

  return requests;
}

function buildBodyRowStyleRequests(params: {
  tableStartIndex: number;
  rowCount: number;
  columnCount: number;
}): docs_v1.Schema$Request[] {
  const { tableStartIndex, rowCount, columnCount } = params;
  const requests: docs_v1.Schema$Request[] = [];
  const borderStyle = buildTableBorderStyle();

  for (let rowIndex = 1; rowIndex < rowCount; rowIndex++) {
    const dataRowIdx = rowIndex - 1;
    const bgColor =
      dataRowIdx % 2 === 0 ? TABLE_COLORS.rowNormal : TABLE_COLORS.rowAlt;

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
      requests.push({
        updateTableCellStyle: {
          tableRange: {
            tableCellLocation: {
              tableStartLocation: { index: tableStartIndex },
              rowIndex,
              columnIndex,
            },
            rowSpan: 1,
            columnSpan: 1,
          },
          tableCellStyle: {
            backgroundColor: {
              color: {
                rgbColor: bgColor,
              },
            },
            borderTop: borderStyle,
            borderBottom: borderStyle,
            borderLeft: borderStyle,
            borderRight: borderStyle,
          },
          fields:
            "backgroundColor,borderTop,borderBottom,borderLeft,borderRight",
        },
      });
    }
  }

  return requests;
}

function buildFillCellRequests(params: {
  cellMatrix: number[][];
  rows: string[][];
}): docs_v1.Schema$Request[] {
  const { cellMatrix, rows } = params;
  const requests: docs_v1.Schema$Request[] = [];

  for (let rowIndex = rows.length - 1; rowIndex >= 0; rowIndex--) {
    for (
      let columnIndex = rows[rowIndex].length - 1;
      columnIndex >= 0;
      columnIndex--
    ) {
      const cellStartIndex = cellMatrix[rowIndex]?.[columnIndex];
      if (!cellStartIndex || cellStartIndex <= 0) continue;

      const text = normalizeCellText(rows[rowIndex][columnIndex] ?? "");
      if (!text) continue;

      requests.push({
        insertText: {
          location: { index: cellStartIndex },
          text,
        },
      });
    }
  }

  return requests;
}

function buildHeaderStyleRequests(
  tableElement: docs_v1.Schema$StructuralElement,
): docs_v1.Schema$Request[] {
  const requests: docs_v1.Schema$Request[] = [];
  const tableStartIndex = tableElement.startIndex ?? 0;
  const firstRow = tableElement.table?.tableRows?.[0];
  if (!firstRow) return requests;

  const borderStyle = buildTableBorderStyle();
  const headerCells = firstRow.tableCells ?? [];

  for (let columnIndex = 0; columnIndex < headerCells.length; columnIndex++) {
    const cell = headerCells[columnIndex];
    requests.push({
      updateTableCellStyle: {
        tableRange: {
          tableCellLocation: {
            tableStartLocation: { index: tableStartIndex },
            rowIndex: 0,
            columnIndex,
          },
          rowSpan: 1,
          columnSpan: 1,
        },
        tableCellStyle: {
          backgroundColor: {
            color: {
              rgbColor: TABLE_COLORS.headerBg,
            },
          },
          borderTop: borderStyle,
          borderBottom: borderStyle,
          borderLeft: borderStyle,
          borderRight: borderStyle,
        },
        fields: "backgroundColor,borderTop,borderBottom,borderLeft,borderRight",
      },
    });

    const rangeStart = (cell.startIndex ?? 0) + 1;
    const rangeEnd = (cell.endIndex ?? 0) - 1;
    if (rangeEnd <= rangeStart) continue;

    requests.push({
      updateTextStyle: {
        range: {
          startIndex: rangeStart,
          endIndex: rangeEnd,
        },
        textStyle: {
          bold: true,
          foregroundColor: {
            color: { rgbColor: TABLE_COLORS.headerText },
          },
          fontSize: { magnitude: 10, unit: "PT" },
        },
        fields: "bold,foregroundColor,fontSize",
      },
    });
  }

  return requests;
}

async function ensureSectionMarkers(params: {
  docs: docs_v1.Docs;
  documentId: string;
  startMarker: string;
  endMarker: string;
}): Promise<MarkerPosition> {
  const { docs, documentId, startMarker, endMarker } = params;

  const doc = await docs.documents.get({ documentId });
  const content = doc.data.body?.content ?? [];
  const existing = findMarkerPositions(content, startMarker, endMarker);
  if (existing.found) return existing;

  const insertIndex = getBodyEndIndex(content);

  // Add spacing between sections
  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: insertIndex },
            text: `\n\n${startMarker}\n${endMarker}\n\n`,
          },
        },
      ],
    },
  });

  const docAfterInsert = await docs.documents.get({ documentId });
  const contentAfterInsert = docAfterInsert.data.body?.content ?? [];
  const inserted = findMarkerPositions(
    contentAfterInsert,
    startMarker,
    endMarker,
  );

  if (!inserted.found) {
    throw new Error(
      "Tidak bisa membuat marker section di dokumen Google Docs. Pastikan service account memiliki akses edit.",
    );
  }

  return inserted;
}

async function writeSubsectionToDoc(params: {
  documentId: string;
  startMarker: string;
  endMarker: string;
  parentStartMarker: string;
  parentEndMarker: string;
  headerRow: string[];
  dataRows: string[][];
  columnWidths: number[];
  sectionTitle: string;
  sectionSubtitle: string;
}): Promise<void> {
  const {
    documentId,
    startMarker,
    endMarker,
    parentStartMarker,
    parentEndMarker,
    headerRow,
    dataRows,
    columnWidths,
    sectionTitle,
    sectionSubtitle,
  } = params;

  const docs = await getDocsClient();
  const allRows = normalizeRows(headerRow, dataRows);
  const rowCount = allRows.length;
  const columnCount = headerRow.length;

  // Get current document state
  const doc = await docs.documents.get({ documentId });
  const content = doc.data.body?.content ?? [];

  // Find parent section
  const parentPosition = findMarkerPositions(
    content,
    parentStartMarker,
    parentEndMarker,
  );

  if (!parentPosition.found) {
    throw new Error(
      `Parent section ${parentStartMarker} tidak ditemukan. Pastikan section utama sudah dibuat.`,
    );
  }

  // Check if subsection already exists
  const existingSubsection = findMarkerPositions(
    content,
    startMarker,
    endMarker,
  );

  let insertIndex: number;
  const pass1Requests: docs_v1.Schema$Request[] = [];

  if (existingSubsection.found) {
    // Delete existing content between markers
    if (
      existingSubsection.contentEndIndex > existingSubsection.contentStartIndex
    ) {
      pass1Requests.push({
        deleteContentRange: {
          range: {
            startIndex: existingSubsection.contentStartIndex,
            endIndex: existingSubsection.contentEndIndex,
          },
        },
      });
    }
    insertIndex = existingSubsection.contentStartIndex;
  } else {
    // Create new subsection markers before parent end marker
    const markerInsertIndex = parentPosition.contentEndIndex;
    pass1Requests.push({
      insertText: {
        location: { index: markerInsertIndex },
        text: `${startMarker}\n${endMarker}\n`,
      },
    });

    // After inserting markers, content will be between them
    insertIndex = markerInsertIndex + startMarker.length + 1;
  }

  // Add heading and table
  const { requests: headingRequests, textLength: headingLength } =
    buildHeadingRequests(insertIndex, sectionTitle, sectionSubtitle);
  pass1Requests.push(...headingRequests);

  const tableInsertIndex = insertIndex + headingLength;
  pass1Requests.push({
    insertTable: {
      rows: rowCount,
      columns: columnCount,
      location: { index: tableInsertIndex },
    },
  });

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests: pass1Requests },
  });

  // Get updated document and find the table
  const doc2 = await docs.documents.get({ documentId });
  const content2 = doc2.data.body?.content ?? [];
  const tableIndex = selectTableIndex({
    content: content2,
    minStartIndex: tableInsertIndex,
    expectedRows: rowCount,
    expectedCols: columnCount,
  });

  if (tableIndex < 0) {
    throw new Error(
      "Tabel subsection tidak ditemukan setelah insert. Coba export ulang.",
    );
  }

  const tables2 = getTableElements(content2);
  const targetTable2 = tables2[tableIndex];
  const tableStartIndex = targetTable2.startIndex ?? 0;
  const cellMatrix = extractCellMatrixFromTable(targetTable2);

  // Style and fill table
  const pass2Requests: docs_v1.Schema$Request[] = [
    ...buildColumnWidthRequests({
      tableStartIndex,
      columnCount,
      widths: columnWidths,
    }),
    ...buildBodyRowStyleRequests({
      tableStartIndex,
      rowCount,
      columnCount,
    }),
    ...buildFillCellRequests({
      cellMatrix,
      rows: allRows,
    }),
  ];

  if (pass2Requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests: pass2Requests },
    });
  }

  // Apply header styles
  const doc3 = await docs.documents.get({ documentId });
  const content3 = doc3.data.body?.content ?? [];
  const tableIndex3 = selectTableIndex({
    content: content3,
    minStartIndex: tableStartIndex,
    expectedRows: rowCount,
    expectedCols: columnCount,
  });

  if (tableIndex3 < 0) {
    return;
  }

  const tables3 = getTableElements(content3);
  const targetTable3 = tables3[tableIndex3];
  const pass3Requests = buildHeaderStyleRequests(targetTable3);

  if (pass3Requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests: pass3Requests },
    });
  }
}

async function writeSectionToDoc(params: {
  documentId: string;
  exportType: ExportType;
  headerRow: string[];
  dataRows: string[][];
  columnWidths: number[];
  sectionTitle: string;
  sectionSubtitle: string;
}): Promise<void> {
  const {
    documentId,
    exportType,
    headerRow,
    dataRows,
    columnWidths,
    sectionTitle,
    sectionSubtitle,
  } = params;

  const docs = await getDocsClient();
  const markers = MARKERS[exportType];
  const allRows = normalizeRows(headerRow, dataRows);
  const rowCount = allRows.length;
  const columnCount = headerRow.length;

  const markerPosition = await ensureSectionMarkers({
    docs,
    documentId,
    startMarker: markers.start,
    endMarker: markers.end,
  });

  const pass1Requests: docs_v1.Schema$Request[] = [];
  const insertIndex = markerPosition.contentStartIndex;

  if (markerPosition.contentEndIndex > markerPosition.contentStartIndex) {
    pass1Requests.push({
      deleteContentRange: {
        range: {
          startIndex: markerPosition.contentStartIndex,
          endIndex: markerPosition.contentEndIndex,
        },
      },
    });
  }

  const { requests: headingRequests, textLength: headingLength } =
    buildHeadingRequests(insertIndex, sectionTitle, sectionSubtitle);
  pass1Requests.push(...headingRequests);

  const tableInsertIndex = insertIndex + headingLength;
  pass1Requests.push({
    insertTable: {
      rows: rowCount,
      columns: columnCount,
      location: { index: tableInsertIndex },
    },
  });

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests: pass1Requests },
  });

  const doc2 = await docs.documents.get({ documentId });
  const content2 = doc2.data.body?.content ?? [];
  const tableIndex = selectTableIndex({
    content: content2,
    minStartIndex: tableInsertIndex,
    expectedRows: rowCount,
    expectedCols: columnCount,
  });

  if (tableIndex < 0) {
    throw new Error("Tabel tidak ditemukan setelah insert. Coba export ulang.");
  }

  const tables2 = getTableElements(content2);
  const targetTable2 = tables2[tableIndex];
  const tableStartIndex = targetTable2.startIndex ?? 0;
  const cellMatrix = extractCellMatrixFromTable(targetTable2);

  const pass2Requests: docs_v1.Schema$Request[] = [
    ...buildColumnWidthRequests({
      tableStartIndex,
      columnCount,
      widths: columnWidths,
    }),
    ...buildBodyRowStyleRequests({
      tableStartIndex,
      rowCount,
      columnCount,
    }),
    ...buildFillCellRequests({
      cellMatrix,
      rows: allRows,
    }),
  ];

  if (pass2Requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests: pass2Requests },
    });
  }

  const doc3 = await docs.documents.get({ documentId });
  const content3 = doc3.data.body?.content ?? [];
  const tableIndex3 = selectTableIndex({
    content: content3,
    minStartIndex: tableStartIndex,
    expectedRows: rowCount,
    expectedCols: columnCount,
  });

  if (tableIndex3 < 0) {
    return;
  }

  const tables3 = getTableElements(content3);
  const targetTable3 = tables3[tableIndex3];
  const pass3Requests = buildHeaderStyleRequests(targetTable3);

  if (pass3Requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests: pass3Requests },
    });
  }
}

function fmtStatus(status: string): string {
  const map: Record<string, string> = {
    backlog: "Backlog",
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "Review",
    done: "Selesai",
    cancelled: "Dibatalkan",
  };

  const key = String(status || "").toLowerCase();
  return map[key] ?? status;
}

function fmtPriority(priority: string): string {
  const map: Record<string, string> = {
    urgent: "Urgent",
    high: "Tinggi",
    medium: "Sedang",
    low: "Rendah",
  };

  const key = String(priority || "").toLowerCase();
  return map[key] ?? priority;
}

export function extractDocumentId(value: string): string | null {
  const input = String(value || "").trim();
  if (!input) return null;

  if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) {
    return input;
  }

  const match = input.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export const googleDocsService = {
  extractDocumentId,

  async exportPlanning(
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
      // Format jadwal
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
  },

  async exportBacklog(
    documentId: string,
    items: BacklogItem[],
    teamName: string,
  ): Promise<void> {
    const docs = await getDocsClient();
    const updatedAt = toIndonesianDateTime();

    // Ensure main backlog section exists
    const mainMarkers = MARKERS.backlog;
    await ensureSectionMarkers({
      docs,
      documentId,
      startMarker: mainMarkers.start,
      endMarker: mainMarkers.end,
    });

    // Separate product and priority items
    const productItems = items;
    const priorityItems = items.filter((item) => {
      const priority = String(item.priority || "").toLowerCase();
      return priority === "urgent" || priority === "high";
    });

    // Export Product Backlog
    const productHeader = [
      "No",
      "ID",
      "Nama Fitur",
      "Deskripsi",
      "Target User",
    ];
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

    // Export Priority Backlog (only if there are priority items)
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
        sectionSubtitle: `${priorityItems.length} item prioritas tinggi/urgent`,
      });
    }
  },

  async exportExecution(
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
  },
};

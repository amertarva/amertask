import type { docs_v1 } from "@googleapis/docs";

export function toIndonesianDateTime(value: Date = new Date()) {
  return value.toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export function toIndonesianDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function normalizeCellText(value: string) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

export function normalizeRows(headerRow: string[], dataRows: string[][]) {
  const columnCount = headerRow.length;
  const allRows = [headerRow, ...dataRows].map((row) =>
    Array.from({ length: columnCount }, (_, idx) =>
      normalizeCellText(String(row[idx] ?? "")),
    ),
  );

  return allRows;
}

export function extractParagraphText(
  element: docs_v1.Schema$StructuralElement,
) {
  const paragraphElements = element.paragraph?.elements ?? [];
  return paragraphElements
    .map((paragraphElement) => paragraphElement.textRun?.content ?? "")
    .join("");
}

export function getBodyEndIndex(content: docs_v1.Schema$StructuralElement[]) {
  const lastElement = content[content.length - 1];
  return Math.max(1, (lastElement?.endIndex ?? 2) - 1);
}

export function getTableElements(content: docs_v1.Schema$StructuralElement[]) {
  return content.filter((element) => !!element.table);
}

export function getTableColumnCount(
  tableElement: docs_v1.Schema$StructuralElement,
) {
  const firstRow = tableElement.table?.tableRows?.[0];
  return firstRow?.tableCells?.length ?? 0;
}

export function extractCellMatrixFromTable(
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

export function fmtStatus(status: string): string {
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

export function fmtPriority(priority: string): string {
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

import type { docs_v1 } from "@googleapis/docs";
import { TABLE_COLORS } from "./constants";
import {
  normalizeCellText,
  getTableElements,
  getTableColumnCount,
} from "./utils";

export function selectTableIndex(params: {
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

export function buildTableBorderStyle(): docs_v1.Schema$TableCellBorder {
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

export function buildHeadingRequests(
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

export function buildColumnWidthRequests(params: {
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

export function buildBodyRowStyleRequests(params: {
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

export function buildFillCellRequests(params: {
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

export function buildHeaderStyleRequests(
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

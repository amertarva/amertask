import type { docs_v1 } from "@googleapis/docs";
import type { ExportType } from "../constants";
import { MARKERS } from "../constants";
import { normalizeRows } from "../utils";
import { getDocsClient, ensureSectionMarkers } from "../document";
import {
  buildHeadingRequests,
  buildColumnWidthRequests,
  buildBodyRowStyleRequests,
  buildFillCellRequests,
  buildHeaderStyleRequests,
  selectTableIndex,
} from "../table";
import { getTableElements, extractCellMatrixFromTable } from "../utils";

export async function writeSectionToDoc(params: {
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

import type { docs_v1 } from "@googleapis/docs";
import { normalizeRows } from "../utils";
import { getDocsClient, findMarkerPositions } from "../document";
import {
  buildHeadingRequests,
  buildColumnWidthRequests,
  buildBodyRowStyleRequests,
  buildFillCellRequests,
  buildHeaderStyleRequests,
  selectTableIndex,
} from "../table";
import { getTableElements, extractCellMatrixFromTable } from "../utils";

export async function writeSubsectionToDoc(params: {
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

  const doc = await docs.documents.get({ documentId });
  const content = doc.data.body?.content ?? [];

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

  const existingSubsection = findMarkerPositions(
    content,
    startMarker,
    endMarker,
  );

  let insertIndex: number;
  const pass1Requests: docs_v1.Schema$Request[] = [];

  if (existingSubsection.found) {
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
    const markerInsertIndex = parentPosition.contentEndIndex;
    pass1Requests.push({
      insertText: {
        location: { index: markerInsertIndex },
        text: `${startMarker}\n${endMarker}\n`,
      },
    });

    insertIndex = markerInsertIndex + startMarker.length + 1;
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
    throw new Error(
      "Tabel subsection tidak ditemukan setelah insert. Coba export ulang.",
    );
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

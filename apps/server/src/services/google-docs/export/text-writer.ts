import type { docs_v1 } from "@googleapis/docs";
import { getDocsClient, findMarkerPositions } from "../document";

export async function writeTextSubsection(params: {
  documentId: string;
  startMarker: string;
  endMarker: string;
  parentStartMarker: string;
  parentEndMarker: string;
  sectionTitle: string;
  content: string;
}): Promise<void> {
  const {
    documentId,
    startMarker,
    endMarker,
    parentStartMarker,
    parentEndMarker,
    sectionTitle,
    content,
  } = params;

  const docs = await getDocsClient();

  const doc = await docs.documents.get({ documentId });
  const docContent = doc.data.body?.content ?? [];

  const parentPosition = findMarkerPositions(
    docContent,
    parentStartMarker,
    parentEndMarker,
  );

  if (!parentPosition.found) {
    throw new Error(
      `Parent section ${parentStartMarker} tidak ditemukan. Pastikan section utama sudah dibuat.`,
    );
  }

  const existingSubsection = findMarkerPositions(
    docContent,
    startMarker,
    endMarker,
  );

  let insertIndex: number;
  const requests: docs_v1.Schema$Request[] = [];

  if (existingSubsection.found) {
    if (
      existingSubsection.contentEndIndex > existingSubsection.contentStartIndex
    ) {
      requests.push({
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
    requests.push({
      insertText: {
        location: { index: markerInsertIndex },
        text: `${startMarker}\n${endMarker}\n`,
      },
    });

    insertIndex = markerInsertIndex + startMarker.length + 1;
  }

  const headingText = `${sectionTitle}\n`;
  requests.push({
    insertText: {
      location: { index: insertIndex },
      text: headingText,
    },
  });

  requests.push({
    updateParagraphStyle: {
      range: {
        startIndex: insertIndex,
        endIndex: insertIndex + headingText.length,
      },
      paragraphStyle: {
        namedStyleType: "HEADING_2",
      },
      fields: "namedStyleType",
    },
  });

  const contentInsertIndex = insertIndex + headingText.length;

  const contentText = `${content}\n\n`;
  requests.push({
    insertText: {
      location: { index: contentInsertIndex },
      text: contentText,
    },
  });

  requests.push({
    updateParagraphStyle: {
      range: {
        startIndex: contentInsertIndex,
        endIndex: contentInsertIndex + contentText.length,
      },
      paragraphStyle: {
        namedStyleType: "NORMAL_TEXT",
      },
      fields: "namedStyleType",
    },
  });

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests },
  });
}

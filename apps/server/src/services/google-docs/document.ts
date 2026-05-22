import type { docs_v1 } from "@googleapis/docs";
import { extractParagraphText, getBodyEndIndex } from "./utils";
import type {
  MarkerPosition,
  ServiceAccountConfig,
} from "../../types/services/docs/types";

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

export async function getDocsClient() {
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

export function findMarkerPositions(
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

export async function ensureSectionMarkers(params: {
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

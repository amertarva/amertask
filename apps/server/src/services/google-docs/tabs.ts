import { getGoogleAuth } from "./auth";

export const TAB_NAMES = {
  planning: "Planning",
  execution: "Execution",
  backlog: "Backlog",
  requirements: "Requirements",
  srs: "SRS",
} as const;

export type TabKey = keyof typeof TAB_NAMES;

export async function getDocumentTabs(
  documentId: string,
): Promise<Array<{ tabId: string; title: string }>> {
  const auth = await getGoogleAuth();
  const { docs } = await import("@googleapis/docs");
  const docsClient = docs({ version: "v1", auth });

  const doc = await docsClient.documents.get({
    documentId,
    includeTabsContent: true,
  } as any);

  const tabs = (doc.data as any).tabs ?? [];
  return tabs.map((tab: any) => ({
    tabId: tab.tabProperties?.tabId ?? "",
    title: tab.tabProperties?.title ?? "",
  }));
}

export async function getOrCreateTab(
  documentId: string,
  tabTitle: string,
): Promise<string> {
  const auth = await getGoogleAuth();
  const { docs } = await import("@googleapis/docs");
  const docsClient = docs({ version: "v1", auth });

  const existingTabs = await getDocumentTabs(documentId);
  const existing = existingTabs.find((t) => t.title === tabTitle);
  if (existing?.tabId) return existing.tabId;

  const result = await docsClient.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          createTab: {
            tabProperties: { title: tabTitle },
          },
        },
      ] as any,
    },
  });

  const reply = (result.data as any).replies?.[0]?.createTab;
  const tabId = reply?.tabProperties?.tabId;

  if (!tabId) throw new Error(`Gagal membuat tab "${tabTitle}"`);
  return tabId;
}

export async function clearTabContent(
  documentId: string,
  tabId: string,
): Promise<void> {
  const auth = await getGoogleAuth();
  const { docs } = await import("@googleapis/docs");
  const docsClient = docs({ version: "v1", auth });

  const doc = await docsClient.documents.get({
    documentId,
    includeTabsContent: true,
  } as any);

  const tabs = (doc.data as any).tabs ?? [];
  const tab = tabs.find((t: any) => t.tabProperties?.tabId === tabId);
  const body = tab?.documentTab?.body?.content ?? [];

  if (body.length <= 1) return;

  const lastEl = body[body.length - 1];
  const endIndex = (lastEl?.endIndex ?? 2) - 1;

  if (endIndex > 1) {
    await docsClient.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            deleteContentRange: {
              range: { tabId, startIndex: 1, endIndex },
            },
          },
        ] as any,
      },
    });
  }
}

export async function writeToTab(
  documentId: string,
  tabId: string,
  content: string,
): Promise<void> {
  const auth = await getGoogleAuth();
  const { docs } = await import("@googleapis/docs");
  const docsClient = docs({ version: "v1", auth });

  await docsClient.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { tabId, index: 1 },
            text: content,
          },
        },
      ] as any,
    },
  });
}

# Upgrade: Export Google Docs dengan Format Tabel Rapi

## Konteks & Prasyarat

Dokumen ini adalah **upgrade dari `CLAUDE_COPY_TO_GOOGLE_DOCS.md`**.
Asumsikan fitur Copy to Docs sudah berjalan dengan format teks pipe-separated.

**Yang diubah:** Hanya `apps/server/src/services/google-docs.service.ts`
**Yang TIDAK diubah:** Semua file frontend, proxy route, export.routes.ts, hooks, button component

---

## Mengapa Format Lama Buruk

Format lama menggunakan pipe-separated text:

```
No   | Task ID    | Nama Tugas                     | ...
-----|------------|--------------------------------|...
1    | PERDIG-1   | Fix login bug                  | ...
```

Masalahnya:

- Lebar kolom tidak konsisten di semua font (Google Docs pakai font proporsional, bukan monospace)
- Tidak bisa bold header, tidak ada warna, tidak ada border visual
- Terlihat seperti kode, bukan dokumen profesional

**Format baru** menggunakan Google Docs Tables API — tabel native dengan:

- Header baris pertama: background biru gelap (`#1a73e8`) + teks putih + bold
- Baris data: alternating white dan light blue (`#e8f0fe`) untuk readability
- Border tipis pada setiap cell
- Lebar kolom proporsional per tipe konten
- Section title dengan heading style

---

## Konsep Kunci: Two-Pass API Call

Google Docs API tidak bisa insert tabel dan isi cell dalam satu batch — posisi cell baru tidak diketahui sebelum tabel dibuat. Solusinya adalah **two-pass**:

```
Pass 1: batchUpdate
  → Hapus konten lama (jika ada di antara marker)
  → Insert section title text
  → Insert tabel kosong (insertTable)

Re-fetch dokumen
  → Baca posisi cell yang baru dibuat

Pass 2: batchUpdate (REVERSE ORDER — penting!)
  → Isi setiap cell dengan insertText
  → Apply styling pada header row (bold + background)
```

**Kenapa reverse order saat isi cell?**
Setiap `insertText` menggeser index semua elemen setelahnya. Dengan mengisi dari cell terakhir ke cell pertama, index sebelumnya tidak pernah bergeser.

---

## IMPLEMENTASI — Timpa Seluruh File

**File: `apps/server/src/services/google-docs.service.ts`**

Timpa seluruh isi file dengan implementasi berikut:

```typescript
import { google, docs_v1 } from "googleapis";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Markers ─────────────────────────────────────────────────────────────────

const MARKERS = {
  planning: {
    start: "[TASKOPS-PLANNING-START]",
    end: "[TASKOPS-PLANNING-END]",
  },
  backlog: { start: "[TASKOPS-BACKLOG-START]", end: "[TASKOPS-BACKLOG-END]" },
  execution: {
    start: "[TASKOPS-EXECUTION-START]",
    end: "[TASKOPS-EXECUTION-END]",
  },
} as const;

// ─── Warna Tabel ─────────────────────────────────────────────────────────────

const TABLE_COLORS = {
  headerBg: { red: 0.102, green: 0.451, blue: 0.914 }, // #1a73e8 — Google Blue
  headerText: { red: 1, green: 1, blue: 1 }, // #ffffff — White
  rowAlt: { red: 0.91, green: 0.941, blue: 0.996 }, // #e8f0fe — Light blue
  rowNormal: { red: 1, green: 1, blue: 1 }, // #ffffff — White
  border: { red: 0.827, green: 0.851, blue: 0.914 }, // #d3d9e9 — Soft border
};

// ─── Helper: Google Auth ─────────────────────────────────────────────────────

function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!privateKey || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    throw new Error(
      "Google Service Account credentials tidak ditemukan di .env",
    );
  }
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
      project_id: process.env.GOOGLE_PROJECT_ID,
    },
    scopes: ["https://www.googleapis.com/auth/documents"],
  });
}

// ─── Helper: Extract Document ID ─────────────────────────────────────────────

export function extractDocumentId(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// ─── Helper: Cari Marker di Dokumen ──────────────────────────────────────────

interface MarkerPosition {
  startIndex: number;
  endIndex: number;
  found: boolean;
}

function findMarkers(
  content: docs_v1.Schema$StructuralElement[],
  startMarker: string,
  endMarker: string,
): MarkerPosition {
  let startIndex = -1;
  let endIndex = -1;

  for (const el of content) {
    if (!el.paragraph) continue;
    const text = (el.paragraph.elements ?? [])
      .map((e) => e.textRun?.content ?? "")
      .join("")
      .trim();

    if (text === startMarker && startIndex === -1) {
      startIndex = el.startIndex ?? 0;
    }
    if (text === endMarker && startIndex !== -1) {
      endIndex = el.endIndex ?? 0;
      break;
    }
  }

  return { startIndex, endIndex, found: startIndex !== -1 && endIndex !== -1 };
}

// ─── Helper: Temukan Semua Cell dalam Tabel ───────────────────────────────────
// Mengembalikan array [row][col] berisi startIndex setiap cell

function extractTableCells(
  content: docs_v1.Schema$StructuralElement[],
): number[][][] {
  const tables: number[][][] = [];

  for (const el of content) {
    if (!el.table) continue;
    const rows: number[][] = [];
    for (const row of el.table.tableRows ?? []) {
      const cols: number[] = [];
      for (const cell of row.tableCells ?? []) {
        // startIndex dari paragraf pertama di dalam cell
        const firstPara = cell.content?.[0];
        cols.push(firstPara?.startIndex ?? 0);
      }
      rows.push(cols);
    }
    tables.push(rows);
  }

  return tables;
}

// ─── Helper: Build requests untuk styling header row ─────────────────────────
// Dipanggil SETELAH tabel terisi, karena butuh range yang sudah ada teksnya

function buildHeaderStyleRequests(
  content: docs_v1.Schema$StructuralElement[],
  tableIndex: number, // index tabel ke-berapa dari atas dokumen
): docs_v1.Schema$Request[] {
  const tables = content.filter((el) => el.table);
  const table = tables[tableIndex];
  if (!table?.table) return [];

  const requests: docs_v1.Schema$Request[] = [];
  const firstRow = table.table.tableRows?.[0];
  if (!firstRow) return [];

  for (const cell of firstRow.tableCells ?? []) {
    const cellStart = cell.startIndex ?? 0;
    const cellEnd = cell.endIndex ?? 0;

    if (cellEnd <= cellStart) continue;

    // Background cell header
    requests.push({
      updateTableCellStyle: {
        tableStartLocation: { index: table.startIndex ?? 0 },
        rowIndices: [0],
        columnIndices: [(firstRow.tableCells ?? []).indexOf(cell)],
        tableCellStyle: {
          backgroundColor: { color: { rgbColor: TABLE_COLORS.headerBg } },
        },
        fields: "backgroundColor",
      },
    });

    // Teks bold + warna putih di header
    requests.push({
      updateTextStyle: {
        range: { startIndex: cellStart + 1, endIndex: cellEnd - 1 },
        textStyle: {
          bold: true,
          foregroundColor: { color: { rgbColor: TABLE_COLORS.headerText } },
          fontSize: { magnitude: 10, unit: "PT" },
        },
        fields: "bold,foregroundColor,fontSize",
      },
    });
  }

  return requests;
}

// ─── Helper: Build requests untuk alternating row color ──────────────────────

function buildRowColorRequests(
  content: docs_v1.Schema$StructuralElement[],
  tableIndex: number,
): docs_v1.Schema$Request[] {
  const tables = content.filter((el) => el.table);
  const table = tables[tableIndex];
  if (!table?.table) return [];

  const requests: docs_v1.Schema$Request[] = [];
  const rows = table.table.tableRows ?? [];

  // Skip row pertama (header), mulai dari row ke-2
  rows.slice(1).forEach((row, rowIdx) => {
    const bgColor =
      rowIdx % 2 === 0
        ? TABLE_COLORS.rowNormal // genap → putih
        : TABLE_COLORS.rowAlt; // ganjil → light blue

    (row.tableCells ?? []).forEach((cell, colIdx) => {
      requests.push({
        updateTableCellStyle: {
          tableStartLocation: { index: table.startIndex ?? 0 },
          rowIndices: [rowIdx + 1],
          columnIndices: [colIdx],
          tableCellStyle: {
            backgroundColor: { color: { rgbColor: bgColor } },
          },
          fields: "backgroundColor",
        },
      });
    });
  });

  return requests;
}

// ─── Helper: Build requests isi cell (REVERSE ORDER) ─────────────────────────
// Mengisi cell dari kanan-bawah ke kiri-atas untuk menjaga index tetap valid

function buildFillCellRequests(
  cellMatrix: number[][],
  rows: string[][], // rows[r][c] = teks untuk cell (r, c)
): docs_v1.Schema$Request[] {
  const requests: docs_v1.Schema$Request[] = [];

  // Iterasi dari baris terakhir ke baris pertama
  for (let r = rows.length - 1; r >= 0; r--) {
    // Iterasi dari kolom terakhir ke kolom pertama
    for (let c = rows[r].length - 1; c >= 0; c--) {
      const cellStartIndex = cellMatrix[r]?.[c];
      if (cellStartIndex === undefined) continue;

      const text = (rows[r][c] ?? "").trim();
      if (!text) continue;

      requests.push({
        insertText: {
          location: { index: cellStartIndex + 1 }, // +1 skip newline awal cell
          text,
        },
      });
    }
  }

  return requests;
}

// ─── Helper: Build column width requests ─────────────────────────────────────
// Sesuaikan lebar kolom (dalam satuan PT — 1 inch = 72 PT)

function buildColumnWidthRequests(
  content: docs_v1.Schema$StructuralElement[],
  tableIndex: number,
  widths: number[], // array lebar per kolom dalam PT
): docs_v1.Schema$Request[] {
  const tables = content.filter((el) => el.table);
  const table = tables[tableIndex];
  if (!table?.table) return [];

  const requests: docs_v1.Schema$Request[] = [];
  const firstRow = table.table.tableRows?.[0];
  if (!firstRow) return [];
  (firstRow.tableCells ?? []).forEach((_, colIdx) => {
    const width = widths[colIdx];
    if (!width) return;
    requests.push({
      updateTableColumnProperties: {
        tableStartLocation: { index: table.startIndex ?? 0 },
        columnIndices: [colIdx],
        tableColumnProperties: {
          widthType: "FIXED_WIDTH",
          width: { magnitude: width, unit: "PT" },
        },
        fields: "widthType,width",
      },
    });
  });

  return requests;
}

// ─── Helper: Insert section heading ──────────────────────────────────────────

function buildHeadingRequests(
  insertIndex: number,
  title: string,
  subtitle: string,
): { requests: docs_v1.Schema$Request[]; textLength: number } {
  const fullText = `${title}\n${subtitle}\n`;
  const titleEnd = insertIndex + title.length + 1;
  const subtitleEnd = titleEnd + subtitle.length + 1;

  const requests: docs_v1.Schema$Request[] = [
    {
      insertText: {
        location: { index: insertIndex },
        text: fullText,
      },
    },
    // Style judul
    {
      updateParagraphStyle: {
        range: {
          startIndex: insertIndex,
          endIndex: insertIndex + title.length,
        },
        paragraphStyle: { namedStyleType: "HEADING_2" },
        fields: "namedStyleType",
      },
    },
    {
      updateTextStyle: {
        range: {
          startIndex: insertIndex,
          endIndex: insertIndex + title.length,
        },
        textStyle: {
          bold: true,
          fontSize: { magnitude: 14, unit: "PT" },
          foregroundColor: {
            color: { rgbColor: { red: 0.067, green: 0.133, blue: 0.267 } },
          },
        },
        fields: "bold,fontSize,foregroundColor",
      },
    },
    // Style subtitle
    {
      updateTextStyle: {
        range: { startIndex: titleEnd, endIndex: subtitleEnd - 1 },
        textStyle: {
          bold: false,
          italic: true,
          fontSize: { magnitude: 9, unit: "PT" },
          foregroundColor: {
            color: { rgbColor: { red: 0.4, green: 0.4, blue: 0.4 } },
          },
        },
        fields: "bold,italic,fontSize,foregroundColor",
      },
    },
  ];

  return { requests, textLength: fullText.length };
}

// ─── Core: Write Section ke Dokumen ──────────────────────────────────────────

async function writeSectionToDoc(params: {
  documentId: string;
  exportType: ExportType;
  headerRow: string[];
  dataRows: string[][];
  columnWidths: number[]; // dalam PT, total harus ≤ 468 (A4 landscape margin)
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

  const auth = getGoogleAuth();
  const docs = google.docs({ version: "v1", auth });
  const markers = MARKERS[exportType];
  const allRows = [headerRow, ...dataRows];
  const numRows = allRows.length;
  const numCols = headerRow.length;

  // ══════════════════════════════════════════════════════════════════
  // PASS 1: Hapus konten lama + insert heading + insert empty table
  // ══════════════════════════════════════════════════════════════════

  const doc1 = await docs.documents.get({ documentId });
  const content1 = doc1.data.body?.content ?? [];
  const position = findMarkers(content1, markers.start, markers.end);

  const pass1Requests: docs_v1.Schema$Request[] = [];
  let insertIndex: number;

  if (position.found) {
    // Konten lama ada → hapus isi di antara marker (pertahankan marker-nya)
    const innerStart = position.startIndex + markers.start.length + 1;
    const innerEnd = position.endIndex - markers.end.length - 1;

    if (innerEnd > innerStart) {
      pass1Requests.push({
        deleteContentRange: {
          range: { startIndex: innerStart, endIndex: innerEnd },
        },
      });
    }
    insertIndex = innerStart;
  } else {
    // Belum ada → append ke akhir dokumen, buat marker baru
    const lastEl = content1[content1.length - 1];
    const bodyEnd = (lastEl?.endIndex ?? 2) - 1;
    insertIndex = Math.max(1, bodyEnd);

    // Insert marker pembuka
    pass1Requests.push({
      insertText: {
        location: { index: insertIndex },
        text: `\n${markers.start}\n`,
      },
    });
    insertIndex += markers.start.length + 2; // kompensasi teks marker

    // Insert marker penutup (akan diinsert setelah konten)
    // Kita tambahkan marker.end setelah tabel nanti di pass2
  }

  // Insert heading (title + subtitle)
  const { requests: headingRequests, textLength: headingLen } =
    buildHeadingRequests(insertIndex, sectionTitle, sectionSubtitle);

  pass1Requests.push(...headingRequests);

  // Insert tabel kosong setelah heading
  const tableInsertIndex = insertIndex + headingLen;
  pass1Requests.push({
    insertTable: {
      rows: numRows,
      columns: numCols,
      location: { index: tableInsertIndex },
    },
  });

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests: pass1Requests },
  });

  // ══════════════════════════════════════════════════════════════════
  // Re-fetch: baca posisi cell yang baru dibuat
  // ══════════════════════════════════════════════════════════════════

  const doc2 = await docs.documents.get({ documentId });
  const content2 = doc2.data.body?.content ?? [];

  // Cari tabel yang baru dibuat — ambil tabel pertama setelah insertIndex
  // (bisa ada beberapa tabel jika dokumen sudah punya tabel sebelumnya)
  const allTables = content2.filter((el) => el.table);
  let targetTableIndex = 0;
  for (let i = 0; i < allTables.length; i++) {
    if ((allTables[i].startIndex ?? 0) > insertIndex) {
      targetTableIndex = i;
      break;
    }
    targetTableIndex = i; // fallback: tabel terakhir yang ditemukan
  }

  const cellMatrix = extractTableCells(content2);
  const targetCells = cellMatrix[targetTableIndex];

  if (!targetCells || targetCells.length === 0) {
    throw new Error(
      "Tabel tidak ditemukan setelah insert. Dokumen mungkin perlu di-share ulang ke service account.",
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // PASS 2: Isi cell (reverse order) + styling header + row colors + column width
  // ══════════════════════════════════════════════════════════════════

  const pass2Requests: docs_v1.Schema$Request[] = [];

  // 1. Lebar kolom
  pass2Requests.push(
    ...buildColumnWidthRequests(content2, targetTableIndex, columnWidths),
  );

  // 2. Alternating row color (data rows, bukan header)
  pass2Requests.push(...buildRowColorRequests(content2, targetTableIndex));

  // 3. Isi cell — REVERSE ORDER agar index tidak bergeser
  pass2Requests.push(...buildFillCellRequests(targetCells, allRows));

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests: pass2Requests },
  });

  // ══════════════════════════════════════════════════════════════════
  // PASS 3: Styling header (butuh range teks yang sudah ada)
  // ══════════════════════════════════════════════════════════════════

  const doc3 = await docs.documents.get({ documentId });
  const content3 = doc3.data.body?.content ?? [];

  const pass3Requests: docs_v1.Schema$Request[] = [
    ...buildHeaderStyleRequests(content3, targetTableIndex),
  ];

  // Jika marker penutup belum ada, tambahkan setelah tabel
  if (!position.found) {
    const allTables3 = content3.filter((el) => el.table);
    const targetTable3 = allTables3[targetTableIndex];
    const tableEndIdx = targetTable3?.endIndex ?? 0;
    if (tableEndIdx > 0) {
      pass3Requests.push({
        insertText: {
          location: { index: tableEndIdx },
          text: `\n${markers.end}\n`,
        },
      });
    }
  }

  if (pass3Requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests: pass3Requests },
    });
  }
}

// ─── Helper: Format status label ─────────────────────────────────────────────

function fmtStatus(status: string): string {
  const map: Record<string, string> = {
    backlog: "Backlog",
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "Review",
    done: "Selesai",
    cancelled: "Dibatalkan",
  };
  return map[status] ?? status;
}

function fmtPriority(priority: string): string {
  const map: Record<string, string> = {
    urgent: "Urgent 🔴",
    high: "Tinggi 🟠",
    medium: "Sedang 🟡",
    low: "Rendah 🟢",
  };
  return map[priority] ?? priority;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const googleDocsService = {
  extractDocumentId,

  async exportPlanning(
    documentId: string,
    items: PlanningItem[],
    teamName: string,
  ): Promise<void> {
    const updatedAt = new Date().toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const headerRow = [
      "No",
      "Task ID",
      "Nama Tugas",
      "Expected Output",
      "Ditugaskan ke",
      "Status",
      "Prioritas",
      "Dibuat oleh",
    ];

    const dataRows = items.map((item, idx) => [
      String(idx + 1),
      `${item.teamSlug}-${item.number}`,
      item.title ?? "",
      item.planInfo ?? "-",
      item.assignedUser ?? "Unassigned",
      fmtStatus(item.status),
      fmtPriority(item.priority),
      item.createdBy ?? "-",
    ]);

    // Lebar kolom dalam PT — total = 468 PT (A4 portrait, margin normal)
    // No(24) + TaskID(54) + Tugas(100) + Output(90) + Assignee(72) + Status(54) + Prioritas(48) + Creator(26)
    const columnWidths = [24, 54, 100, 90, 72, 54, 48, 26];

    await writeSectionToDoc({
      documentId,
      exportType: "planning",
      headerRow,
      dataRows,
      columnWidths,
      sectionTitle: `📋 Planning — ${teamName}`,
      sectionSubtitle: `Diperbarui: ${updatedAt} · Total: ${items.length} task`,
    });
  },

  async exportBacklog(
    documentId: string,
    items: BacklogItem[],
    teamName: string,
  ): Promise<void> {
    const updatedAt = new Date().toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });

    // Product Backlog — semua item tanpa filter priority khusus
    const productItems = items;
    const priorityItems = items.filter(
      (i) => i.priority === "urgent" || i.priority === "high",
    );

    // ── Product Backlog table ──
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
    // No(24) + ID(54) + Fitur(130) + Deskripsi(180) + User(80)
    const productWidths = [24, 54, 130, 180, 80];

    await writeSectionToDoc({
      documentId,
      exportType: "backlog",
      headerRow: productHeader,
      dataRows: productRows,
      columnWidths: productWidths,
      sectionTitle: `📦 Product Backlog — ${teamName}`,
      sectionSubtitle: `Diperbarui: ${updatedAt} · Total: ${productItems.length} item`,
    });

    // ── Priority Backlog table — append ke section yang sama ──
    // Karena exportType sama ('backlog'), marker sudah ada → akan mencari posisi
    // dan menulis setelah tabel pertama. Kita perlu section terpisah untuk priority.
    // Solusi: gunakan exportType unik 'backlog-priority' dengan marker sendiri.
    // Tapi karena MARKERS hanya punya 3 tipe, kita append priority ke dokumen
    // secara manual setelah section backlog utama.

    if (priorityItems.length > 0) {
      const priorityHeader = ["No", "ID", "Nama Fitur", "Prioritas", "Alasan"];
      const priorityRows = priorityItems.map((item, idx) => [
        String(idx + 1),
        `${item.teamSlug}-${item.number}`,
        item.title ?? "",
        fmtPriority(item.priority),
        item.reason ?? "Tidak ada alasan tercatat",
      ]);
      // No(24) + ID(54) + Fitur(130) + Prioritas(60) + Alasan(200)
      const priorityWidths = [24, 54, 130, 60, 200];

      // Append priority tabel sebagai sub-section — gunakan marker berbeda
      await appendSubSection({
        documentId,
        headerRow: priorityHeader,
        dataRows: priorityRows,
        columnWidths: priorityWidths,
        sectionTitle: `⚡ Priority Backlog — ${teamName}`,
        sectionSubtitle: `${priorityItems.length} item prioritas tinggi/urgent`,
        anchorMarker: MARKERS.backlog.end,
      });
    }
  },

  async exportExecution(
    documentId: string,
    items: ExecutionItem[],
    teamName: string,
  ): Promise<void> {
    const updatedAt = new Date().toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });

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
      new Date(item.updatedAt).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      item.notes ?? "Tidak ada catatan",
    ]);

    // No(24) + TaskID(54) + Aktivitas(110) + Assignee(72) + Status(54) + Tgl(64) + Catatan(90)
    const columnWidths = [24, 54, 110, 72, 54, 64, 90];

    await writeSectionToDoc({
      documentId,
      exportType: "execution",
      headerRow,
      dataRows,
      columnWidths,
      sectionTitle: `⚡ Execution — ${teamName}`,
      sectionSubtitle: `Diperbarui: ${updatedAt} · Total: ${items.length} aktivitas`,
    });
  },
};

// ─── Helper: Append Sub-Section (untuk Priority Backlog) ─────────────────────
// Insert tabel tambahan SETELAH end marker sebuah section

async function appendSubSection(params: {
  documentId: string;
  headerRow: string[];
  dataRows: string[][];
  columnWidths: number[];
  sectionTitle: string;
  sectionSubtitle: string;
  anchorMarker: string; // teks marker yang menjadi anchor insert point
}): Promise<void> {
  const {
    documentId,
    headerRow,
    dataRows,
    columnWidths,
    sectionTitle,
    sectionSubtitle,
    anchorMarker,
  } = params;

  const auth = getGoogleAuth();
  const docs = google.docs({ version: "v1", auth });
  const allRows = [headerRow, ...dataRows];

  // Cari posisi anchor marker
  const doc1 = await docs.documents.get({ documentId });
  const content1 = doc1.data.body?.content ?? [];

  let anchorIndex = -1;
  for (const el of content1) {
    if (!el.paragraph) continue;
    const text = (el.paragraph.elements ?? [])
      .map((e) => e.textRun?.content ?? "")
      .join("")
      .trim();
    if (text === anchorMarker) {
      anchorIndex = el.endIndex ?? 0;
      break;
    }
  }

  if (anchorIndex === -1) {
    // Anchor tidak ditemukan, append ke akhir
    const lastEl = content1[content1.length - 1];
    anchorIndex = Math.max(1, (lastEl?.endIndex ?? 2) - 1);
  }

  // Insert heading + tabel kosong
  const { requests: headingReqs, textLength: headingLen } =
    buildHeadingRequests(anchorIndex, sectionTitle, sectionSubtitle);

  const tableInsertIndex = anchorIndex + headingLen;

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        ...headingReqs,
        {
          insertTable: {
            rows: allRows.length,
            columns: headerRow.length,
            location: { index: tableInsertIndex },
          },
        },
      ],
    },
  });

  // Re-fetch + isi cell
  const doc2 = await docs.documents.get({ documentId });
  const content2 = doc2.data.body?.content ?? [];
  const cellMatrix = extractTableCells(content2);

  // Cari tabel yang baru dibuat (setelah anchorIndex)
  const tables2 = content2.filter((el) => el.table);
  let tIdx = tables2.length - 1;
  for (let i = 0; i < tables2.length; i++) {
    if ((tables2[i].startIndex ?? 0) >= tableInsertIndex) {
      tIdx = i;
      break;
    }
  }

  const pass2Reqs: docs_v1.Schema$Request[] = [
    ...buildColumnWidthRequests(content2, tIdx, columnWidths),
    ...buildRowColorRequests(content2, tIdx),
    ...buildFillCellRequests(cellMatrix[tIdx] ?? [], allRows),
  ];

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests: pass2Reqs },
  });

  // Pass 3: style header
  const doc3 = await docs.documents.get({ documentId });
  const content3 = doc3.data.body?.content ?? [];
  const tables3 = content3.filter((el) => el.table);
  const tIdx3 = tables3.length - 1; // tabel terakhir = yang baru saja dibuat

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests: buildHeaderStyleRequests(content3, tIdx3) },
  });
}
```

---

## Hasil Visual di Google Docs

Setelah implementasi, tampilan di Google Docs akan seperti ini:

### Planning

```
📋 Planning — Tim Engineering                    ← Heading 2, bold, navy
Diperbarui: Rabu, 21 April 2026 · Total: 12 task ← italic, abu-abu kecil

┌────┬────────────┬──────────────────┬──────────────────┬───────────────┬─────────┬──────────┬────────────┐
│ No │ Task ID    │ Nama Tugas       │ Expected Output  │ Ditugaskan ke │ Status  │ Prioritas│ Dibuat oleh│
│    │            │                  │                  │               │         │          │            │
├────┼────────────┼──────────────────┼──────────────────┼───────────────┼─────────┼──────────┼────────────┤  ← baris putih
│ 1  │ PERDIG-1   │ Fix login bug    │ User bisa login  │ Budi          │ In Prog │ Tinggi🟠 │ Uta        │
├────┼────────────┼──────────────────┼──────────────────┼───────────────┼─────────┼──────────┼────────────┤  ← baris biru muda
│ 2  │ PERDIG-2   │ Dark mode        │ Toggle tersedia  │ Sari          │ To Do   │ Sedang🟡 │ Uta        │
└────┴────────────┴──────────────────┴──────────────────┴───────────────┴─────────┴──────────┴────────────┘

Header: #1a73e8 bg + teks putih bold
Alternating: putih / #e8f0fe (biru muda)
```

### Backlog

```
📦 Product Backlog — Tim Engineering
Diperbarui: ... · Total: 8 item

┌────┬────────────┬────────────────────────────────┬──────────────────────────────────────┬──────────────────┐
│ No │ ID         │ Nama Fitur                      │ Deskripsi                            │ Target User      │
├────┼────────────┼────────────────────────────────┼──────────────────────────────────────┼──────────────────┤
...

⚡ Priority Backlog — Tim Engineering
3 item prioritas tinggi/urgent

┌────┬────────────┬────────────────────────────────┬──────────────┬──────────────────────────────────────────┐
│ No │ ID         │ Nama Fitur                      │ Prioritas    │ Alasan                                   │
├────┼────────────┼────────────────────────────────┼──────────────┼──────────────────────────────────────────┤
...
```

---

## Ringkasan Perubahan

| File                                              | Aksi                                              |
| ------------------------------------------------- | ------------------------------------------------- |
| `apps/server/src/services/google-docs.service.ts` | **TIMPA SELURUH ISI** dengan implementasi di atas |

**Semua file lain tidak perlu diubah** — frontend, proxy route, `export.routes.ts`, hooks, button component semuanya tetap sama.

---

## Troubleshooting

### Tabel terbuat tapi cell kosong

Kemungkinan `targetTableIndex` salah — dokumen sudah punya tabel lain sebelumnya.
Debug: tambahkan `console.log('Tables found:', allTables.map(t => t.startIndex))` setelah re-fetch dan lihat indexnya.

### Error `Invalid requests[0].insertTable: Index N is not at a valid location`

Index insert ada di tengah elemen lain. Pastikan `tableInsertIndex` dihitung setelah `headingLen` dengan benar. Tambahkan `console.log('tableInsertIndex:', tableInsertIndex)` untuk debug.

### Header styling tidak muncul

Pass 3 dilakukan setelah pass 2 selesai — pastikan tidak ada promise yang tidak di-await. Cek urutan `await` di semua pass.

### Priority Backlog tidak muncul

Cek apakah `priorityItems.length > 0`. Jika semua item priority-nya `medium` atau `low`, section ini tidak akan dibuat. Tambahkan log: `console.log('Priority items:', priorityItems.length)`.

---

_Upgrade: Google Docs Table Format — Amertask/TaskOps | April 2026_

# Fix: Gantt Chart Hover Popup (Custom Positioned Tooltip)

## Diagnosis

Popup bawaan Frappe Gantt memiliki dua masalah:

1. **Posisi tidak akurat** — muncul sembarang, tidak tepat di bawah bar
2. **Tidak bisa di-style** — hanya kotak abu-abu polos tanpa dark theme

## Solusi

**Matikan popup Frappe Gantt sepenuhnya.**
Ganti dengan sistem hover custom:

```
Bar di-hover (mouseenter pada SVG element)
    ↓
Hitung posisi bar via getBoundingClientRect()
    ↓
Render React overlay div yang diposisikan absolute
tepat di bawah garis bawah bar
    ↓
Framer Motion animate masuk dari atas ke bawah
```

Pendekatan ini memberi kontrol penuh atas posisi, konten, dan animasi.

---

## Struktur Popup yang Diinginkan

```
┌─────────────────────────────────────────────────────┐
│  ████████████████████████████████████               │ ← bar Gantt
└─────────────────────────────────────────────────────┘
▼ (muncul langsung di bawah garis bawah bar)
┌─────────────────────────────────────────────────────┐
│  #1  Desain UI/UX                    ● In Progress   │ ← header
├──────────────┬──────────────┬────────────────────────┤
│  📅 Mulai    │  🏁 Selesai  │  ⏱ Durasi             │
│  30 Mar 2026 │  26 Apr 2026 │  27 hari (19 hari kerja│
├──────────────┴──────────────┴────────────────────────┤
│  Progress  ████████████████░░░░░░░░  50%             │
├──────────────────────────────────────────────────────┤
│  👤 Alvin Ferina Putra                               │
└──────────────────────────────────────────────────────┘
```

---

## IMPLEMENTASI

### Langkah 1 — Buat Komponen `GanttTooltip`

**File: `apps/web/src/components/dashboard/graph/GanttTooltip.tsx`**

Komponen ini render sebagai `position: fixed` portal yang posisinya
dihitung dari koordinat bar yang di-hover.

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  differenceInCalendarDays,
  differenceInBusinessDays,
  format,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { GraphNode } from "@/lib/core/scheduling.api";
import { STATUS_CONFIG, type IssueStatus } from "./GanttView";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TooltipData {
  node: GraphNode;
  // Posisi bar dalam viewport (dari getBoundingClientRect)
  barRect: {
    left: number;
    right: number;
    bottom: number;
    width: number;
    top: number;
  };
}

interface Props {
  data: TooltipData | null;
  visible: boolean;
}

// ─── Konstanta ────────────────────────────────────────────────────────────────

const TOOLTIP_WIDTH = 340; // px
const TOOLTIP_OFFSET = 8; // jarak dari bawah bar ke atas tooltip (px)
const VIEWPORT_MARGIN = 12; // jarak minimum dari tepi viewport (px)

// ─── Komponen ────────────────────────────────────────────────────────────────

export function GanttTooltip({ data, visible }: Props) {
  if (!data) return null;

  const { node, barRect } = data;
  const cfg =
    STATUS_CONFIG[node.status as IssueStatus] ?? STATUS_CONFIG.backlog;

  // ── Hitung tanggal & durasi ─────────────────────────────────────────────
  const startDate = node.start_date ? new Date(node.start_date) : null;
  const endDate = node.due_date ? new Date(node.due_date) : null;

  const calendarDays =
    startDate && endDate ? differenceInCalendarDays(endDate, startDate) : null;

  const businessDays =
    startDate && endDate ? differenceInBusinessDays(endDate, startDate) : null;

  const startStr = startDate
    ? format(startDate, "d MMM yyyy", { locale: localeId })
    : "—";

  const endStr = endDate
    ? format(endDate, "d MMM yyyy", { locale: localeId })
    : "—";

  // ── Hitung progress bar ─────────────────────────────────────────────────
  const progressMap: Record<string, number> = {
    backlog: 0,
    todo: 0,
    in_progress: 50,
    in_review: 80,
    done: 100,
    cancelled: 0,
  };
  const progress = progressMap[node.status] ?? 0;

  // ── Posisi tooltip ──────────────────────────────────────────────────────
  // Tengahkan di bawah bar, tapi jangan sampai keluar dari viewport
  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 1200;

  let left = barRect.left + barRect.width / 2 - TOOLTIP_WIDTH / 2;
  // Clamp agar tidak keluar kiri/kanan
  left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, viewportWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN),
  );

  const top = barRect.bottom + TOOLTIP_OFFSET;

  // ── Arrow position (di mana panah menunjuk ke bar) ──────────────────────
  // Posisi horizontal panah relatif terhadap tooltip
  const barCenterX = barRect.left + barRect.width / 2;
  const arrowLeftInBox = Math.max(
    16,
    Math.min(barCenterX - left, TOOLTIP_WIDTH - 16),
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="gantt-tooltip"
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: `${top}px`,
            left: `${left}px`,
            width: `${TOOLTIP_WIDTH}px`,
            zIndex: 9999,
            pointerEvents: "none", // tidak ganggu mouse event
          }}
        >
          {/* ── Arrow (segitiga di atas tooltip) ── */}
          <div
            style={{
              position: "absolute",
              top: "-6px",
              left: `${arrowLeftInBox}px`,
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "6px solid #1e1e1e",
            }}
          />

          {/* ── Card ── */}
          <div
            style={{
              background: "#111",
              border: `1px solid ${cfg.dotColor}33`,
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: `0 8px 32px #00000088, 0 0 0 1px #ffffff08`,
            }}
          >
            {/* Header: nama + status */}
            <div
              style={{
                padding: "10px 14px 8px",
                borderBottom: "1px solid #1a1a1a",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#444",
                    marginBottom: "2px",
                    fontFamily: "monospace",
                  }}
                >
                  #{node.number}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#e8e8e8",
                    lineHeight: 1.3,
                    maxWidth: "200px",
                    wordBreak: "break-word",
                  }}
                >
                  {node.title}
                </div>
              </div>

              {/* Status badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 8px",
                  borderRadius: "20px",
                  background: `${cfg.dotColor}18`,
                  border: `1px solid ${cfg.dotColor}44`,
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: cfg.dotColor,
                  }}
                />
                <span
                  style={{
                    fontSize: "10px",
                    color: cfg.dotColor,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Tanggal & durasi */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              {[
                { icon: "📅", label: "Mulai", value: startStr },
                { icon: "🏁", label: "Selesai", value: endStr },
                {
                  icon: "⏱",
                  label: "Durasi",
                  value: calendarDays !== null ? `${calendarDays} hari` : "—",
                  sub:
                    businessDays !== null
                      ? `${businessDays} hari kerja`
                      : undefined,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "8px 12px",
                    borderRight: "1px solid #1a1a1a",
                  }}
                >
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#444",
                      marginBottom: "3px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {item.icon} {item.label.toUpperCase()}
                  </div>
                  <div
                    style={{ fontSize: "11px", color: "#ccc", fontWeight: 600 }}
                  >
                    {item.value}
                  </div>
                  {item.sub && (
                    <div
                      style={{
                        fontSize: "9px",
                        color: "#444",
                        marginTop: "1px",
                      }}
                    >
                      {item.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {progress > 0 && (
              <div
                style={{
                  padding: "8px 14px",
                  borderBottom: "1px solid #1a1a1a",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "5px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#444",
                      letterSpacing: "0.05em",
                    }}
                  >
                    PROGRESS
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: cfg.dotColor,
                      fontWeight: 700,
                    }}
                  >
                    {progress}%
                  </span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: "#1a1a1a",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                    style={{
                      height: "100%",
                      background: `linear-gradient(90deg, ${cfg.color}aa, ${cfg.dotColor})`,
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Assignee */}
            {node.assignee && (
              <div
                style={{
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: `${cfg.dotColor}22`,
                    border: `1px solid ${cfg.dotColor}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: 700,
                    color: cfg.dotColor,
                    flexShrink: 0,
                  }}
                >
                  {node.assignee.initials?.[0] ?? "?"}
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "#888" }}>
                    {node.assignee.name}
                  </div>
                  <div style={{ fontSize: "9px", color: "#444" }}>
                    Ditugaskan ke
                  </div>
                </div>
              </div>
            )}

            {/* Footer: hint drag */}
            <div
              style={{
                padding: "6px 14px",
                background: "#0d0d0d",
                borderTop: "1px solid #1a1a1a",
                fontSize: "9px",
                color: "#333",
              }}
            >
              Drag bar untuk mengubah jadwal · Klik untuk detail
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

### Langkah 2 — Update `GanttView.tsx`

Tambahkan sistem hover custom dan matikan popup Frappe Gantt bawaan.
Cari file GanttView yang sudah ada dan terapkan perubahan berikut:

#### 2A — Tambah state tooltip di dalam komponen

```tsx
// Tambahkan import
import { GanttTooltip, type TooltipData } from "./GanttTooltip";

// Tambahkan state di dalam GanttView
const [tooltip, setTooltip] = useState<TooltipData | null>(null);
const [tooltipVisible, setTooltipVisible] = useState(false);
const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

#### 2B — Fungsi attach hover events setelah Gantt render

Tambahkan fungsi ini di dalam komponen, lalu panggil setelah
`ganttRef.current = new Gantt(...)` selesai:

```typescript
// Attach custom hover ke setiap bar SVG
function attachBarHoverEvents(nodes: GraphNode[]) {
  // Beri waktu Frappe Gantt selesai render DOM
  setTimeout(() => {
    const barWrappers = document.querySelectorAll<SVGGElement>(
      ".gantt .bar-wrapper",
    );

    barWrappers.forEach((wrapper) => {
      const taskId = wrapper.getAttribute("data-id");
      const node = nodes.find((n) => n.id === taskId);
      if (!node) return;

      // Tambahkan data-status untuk CSS styling
      wrapper.setAttribute("data-status", node.status);

      const handleMouseEnter = () => {
        // Clear hide timeout jika ada
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

        // Ambil posisi bar (bukan wrapper, tapi element .bar di dalamnya)
        const barEl = wrapper.querySelector(".bar") as SVGRectElement | null;
        const target = barEl ?? wrapper;
        const rect = target.getBoundingClientRect();

        setTooltip({ node, barRect: rect });
        setTooltipVisible(true);
      };

      const handleMouseLeave = () => {
        // Delay kecil agar tidak flicker saat mouse bergerak di tepi
        hideTimeoutRef.current = setTimeout(() => {
          setTooltipVisible(false);
          // Hapus data setelah animasi exit selesai
          setTimeout(() => setTooltip(null), 200);
        }, 80);
      };

      // Remove listener lama untuk menghindari duplicate
      wrapper.removeEventListener("mouseenter", handleMouseEnter);
      wrapper.removeEventListener("mouseleave", handleMouseLeave);

      wrapper.addEventListener("mouseenter", handleMouseEnter);
      wrapper.addEventListener("mouseleave", handleMouseLeave);
    });
  }, 150);
}
```

#### 2C — Matikan popup bawaan Frappe Gantt

Di bagian konfigurasi `new Gantt(...)`, pastikan:

```typescript
ganttRef.current = new Gantt(containerRef.current, tasks, {
  view_mode: viewMode,
  date_format: "YYYY-MM-DD",
  language: "id",
  bar_height: 32,
  padding: 16,

  // ← HAPUS atau biarkan kosong — kita tidak pakai popup Frappe
  // custom_popup_html: undefined,

  on_date_change: async (task, start, end) => {
    /* ... reschedule logic ... */
  },
  on_click: (task) => {
    /* ... optional detail modal ... */
  },
});

// Panggil attach hover setelah Gantt init
attachBarHoverEvents(filteredNodes);
```

Tambahkan CSS ini untuk menyembunyikan popup bawaan Frappe Gantt:

```css
/* Di dalam blok <style> yang sudah ada di GanttView */

/* Sembunyikan popup bawaan Frappe Gantt — kita pakai custom */
.gantt-tooltip,
.gantt .popup-wrapper {
  display: none !important;
}
```

#### 2D — Render GanttTooltip di JSX

Tambahkan komponen tooltip di luar container Gantt:

```tsx
return (
  <div className={className}>
    {/* ... toolbar, filter toggles, dll ... */}

    {/* Gantt container */}
    <div style={{ position: "relative" }}>
      <div ref={containerRef} />
    </div>

    {/* Custom tooltip — di luar container agar tidak ter-clip */}
    <GanttTooltip data={tooltip} visible={tooltipVisible} />

    {/* ... style tags ... */}
  </div>
);
```

#### 2E — Cleanup timeout saat unmount

```typescript
// Tambahkan useEffect cleanup
useEffect(() => {
  return () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  };
}, []);
```

---

## Hasil Visual

```
SEBELUM (Frappe Gantt default):
  ████████████ Desain UI/UX
  ┌──────────────────────────┐
  │   (kotak abu-abu polos)  │  ← posisi sembarang, tidak styled
  └──────────────────────────┘

SESUDAH (custom tooltip):
  ████████████ Desain UI/UX    ← bar Gantt
  ▼ (8px di bawah garis bawah bar, arrow menunjuk ke atas)
  ┌───────────────────────────────────────┐
  │ #1  Desain UI/UX         ● In Progress│
  ├──────────┬──────────┬─────────────────┤
  │📅 Mulai  │🏁 Selesai│⏱ Durasi        │
  │30 Mar    │26 Apr    │27 hari          │
  │          │          │19 hari kerja    │
  ├──────────┴──────────┴─────────────────┤
  │PROGRESS  ██████████░░░░░  50%         │
  ├───────────────────────────────────────┤
  │ A  Alvin Ferina Putra                 │
  │    Ditugaskan ke                      │
  ├───────────────────────────────────────┤
  │ Drag bar untuk ubah jadwal · Klik...  │
  └───────────────────────────────────────┘
```

**Behavior:**

- Muncul `150ms` setelah Frappe Gantt selesai render
- Animasi: slide down + fade in (`duration: 0.15s`)
- Arrow selalu menunjuk ke tengah bar yang di-hover
- Tooltip tidak keluar dari viewport (di-clamp kanan/kiri)
- `position: fixed` → tidak ter-clip oleh overflow container
- Delay `80ms` saat mouseleave → tidak flicker saat mouse di tepi bar
- Progress bar animate dari 0 → nilai aktual saat tooltip muncul

---

## Verifikasi

```
1. Buka halaman Task Graph → tab Gantt Chart
2. Hover bar "Desain UI/UX"
3. Tooltip harus muncul TEPAT di bawah garis bawah bar
4. Arrow harus menunjuk ke tengah bar
5. Konten harus menampilkan: nama, status, tanggal, durasi, progress, assignee
6. Geser mouse keluar → tooltip hilang dengan smooth fade out
7. Hover bar berbeda → tooltip pindah dengan posisi baru
8. Scroll halaman saat tooltip muncul → tooltip ikut posisi bar (fixed positioning)
9. Bar dekat tepi kanan → tooltip geser ke kiri agar tidak keluar viewport
```

---

## Ringkasan File

| File                                          | Aksi                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `components/dashboard/graph/GanttTooltip.tsx` | **BUAT BARU**                                                         |
| `components/dashboard/graph/GanttView.tsx`    | **EDIT** — matikan popup Frappe, tambah hover events + render tooltip |

---

_Fix: Gantt Hover Tooltip — Amertask | April 2026_

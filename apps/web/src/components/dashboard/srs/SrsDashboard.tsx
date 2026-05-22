"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Lightbulb, Save, Loader2, CheckCircle2, FileText } from "lucide-react";
import { ExportToDocsButton } from "@/components/ui/ExportToDocsButton";
import { Button } from "@/components/ui/Button";
import Swal from "sweetalert2";
import { type Requirement } from "@/lib/core/requirements.api";
import { srsApi } from "@/lib/core/srs.api";
import { cn } from "@/lib/utils";
import type {
  SrsEditData,
  SrsFieldValue,
  SrsSectionGroup,
} from "@/types/components/SrsTypes";
import type { SrsSectionKey } from "@/lib/core/srs.api";

import { SrsMetadata } from "./SrsMetadata";
import { SrsSection } from "./SrsSection";
import { SrsRequirementsPreview } from "./SrsRequirementsPreview";

// ─── Definisi Section Groups ──────────────────────────────────────────────────

const SECTION_GROUPS: SrsSectionGroup[] = [
  {
    number: "1",
    title: "Pendahuluan",
    icon: "file-text",
    fields: [
      {
        key: "purpose",
        label: "Tujuan Dokumen",
        hint: "Untuk apa dokumen ini dibuat dan siapa target audiensnya.",
        rows: 3,
      },
      {
        key: "scope",
        label: "Lingkup Produk",
        hint: "Apa yang bisa dilakukan aplikasi ini (in-scope) dan apa yang tidak (out-of-scope).",
        rows: 3,
      },
      {
        key: "glossary",
        label: "Definisi & Akronim",
        hint: "Glosarium istilah teknis agar tidak ada salah paham.",
        isJson: true,
      },
    ],
  },
  {
    number: "2",
    title: "Deskripsi Umum",
    icon: "telescope",
    fields: [
      {
        key: "productPerspective",
        label: "Perspektif Produk",
        hint: "Apakah aplikasi mandiri atau bagian dari sistem yang lebih besar?",
        rows: 3,
      },
      {
        key: "productFunctions",
        label: "Fungsi Produk",
        hint: "Ringkasan fitur-fitur utama yang akan dikembangkan.",
        rows: 4,
      },
      {
        key: "userCharacteristics",
        label: "Karakteristik Pengguna",
        hint: "Siapa yang menggunakan sistem ini? (Admin, user biasa, operator, dll)",
        isJson: true,
      },
      {
        key: "generalConstraints",
        label: "Batasan Umum",
        hint: "Contoh: harus selesai dalam 3 bulan, hanya berjalan di Android, harus comply GDPR.",
        rows: 3,
      },
    ],
  },
  {
    number: "3",
    title: "Kebutuhan Antarmuka Eksternal",
    icon: "plug",
    fields: [
      {
        key: "uiRequirements",
        label: "User Interface",
        hint: "Gambaran kasar tampilan/layout yang diharapkan.",
        rows: 3,
      },
      {
        key: "hardwareInterface",
        label: "Hardware Interface",
        hint: "Alat/perangkat keras yang dibutuhkan sistem (misal: barcode scanner, printer).",
        rows: 2,
      },
      {
        key: "softwareInterface",
        label: "Software Interface",
        hint: "Hubungan dengan OS, database, atau software pihak ketiga lainnya.",
        rows: 3,
      },
      {
        key: "commInterface",
        label: "Communication Interface",
        hint: "Protokol komunikasi yang digunakan (HTTPS, WebSocket, REST API, dll).",
        rows: 2,
      },
    ],
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function SrsDashboard() {
  const params = useParams();
  const teamSlug = String(params?.teamSlug || "");

  const [editData, setEditData] = useState<SrsEditData>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [requirements, setRequirements] = useState<{
    fr: Requirement[];
    nfr: Requirement[];
  }>({ fr: [], nfr: [] });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load data dari backend ─────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await srsApi.get(teamSlug);
        setRequirements({ fr: data.fr, nfr: data.nfr });

        // Initialize editData dengan data dari backend
        if (data.srs) {
          setEditData({
            version: data.srs.version,
            purpose: data.srs.purpose ?? "",
            scope: data.srs.scope ?? "",
            glossary: data.srs.glossary ?? [],
            productPerspective: data.srs.productPerspective ?? "",
            productFunctions: data.srs.productFunctions ?? "",
            userCharacteristics: data.srs.userCharacteristics ?? [],
            generalConstraints: data.srs.generalConstraints ?? "",
            uiRequirements: data.srs.uiRequirements ?? "",
            hardwareInterface: data.srs.hardwareInterface ?? "",
            softwareInterface: data.srs.softwareInterface ?? "",
            commInterface: data.srs.commInterface ?? "",
          });
        } else {
          // Default values jika belum ada SRS
          setEditData({
            version: "1.0.0",
            purpose: "",
            scope: "",
            glossary: [],
            productPerspective: "",
            productFunctions: "",
            userCharacteristics: [],
            generalConstraints: "",
            uiRequirements: "",
            hardwareInterface: "",
            softwareInterface: "",
            commInterface: "",
          });
        }
      } catch (err) {
        console.error("Error fetching SRS data:", err);
      }
    };

    if (teamSlug) {
      void fetchData();
    }
  }, [teamSlug]);

  // Handle field change

  const handleField = useCallback(
    (key: SrsSectionKey, value: SrsFieldValue) => {
      setEditData((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    [],
  );

  const handleVersionChange = useCallback((value: string) => {
    setEditData((prev) => ({ ...prev, version: value }));
    setIsDirty(true);
  }, []);

  // Handle save

  const handleSave = useCallback(async () => {
    setSaveState("saving");
    try {
      await srsApi.upsert(teamSlug, editData);
      setIsDirty(false);
      setSaveState("saved");

      // Reset ke idle setelah 2 detik
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("[SRS save error]", err);
      setSaveState("error");
      Swal.fire({
        title: "Gagal Menyimpan",
        text:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menyimpan SRS",
        icon: "error",
        customClass: {
          popup: "bg-background text-text border border-border rounded-xl",
          title: "text-text",
        },
      });
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [teamSlug, editData]);

  // Save button UI state

  const saveLabel = {
    idle: isDirty ? "Simpan Perubahan" : "Tersimpan",
    saving: "Menyimpan...",
    saved: "Berhasil Disimpan!",
    error: "Gagal Menyimpan",
  };

  const saveDisabled =
    saveState === "saving" || (!isDirty && saveState === "idle");

  // ─── Handle export success ──────────────────────────────────────────────────

  const handleCopyToDocsSuccess = (documentUrl: string) => {
    Swal.fire({
      title: "Berhasil!",
      text: "SRS berhasil disalin ke Google Docs.",
      icon: "success",
      confirmButtonText: "Buka Google Docs",
      showCancelButton: true,
      cancelButtonText: "Tutup",
      customClass: {
        popup: "bg-background text-text border border-border rounded-xl",
        title: "text-text",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(documentUrl, "_blank");
      }
    });
  };

  return (
    <div className="h-full flex flex-col bg-background p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto overflow-x-hidden w-full relative custom-scrollbar">
      <div className="w-full flex flex-col gap-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/50 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-text tracking-tight">
                SRS Document
              </h1>
            </div>
            <p className="text-sm font-medium text-text-muted max-w-lg leading-relaxed">
              Software Requirements Specification — Kelola spesifikasi kebutuhan
              proyek secara komprehensif dan profesional.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSave}
              disabled={saveDisabled}
              leftIcon={
                saveState === "saving" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveState === "saved" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )
              }
              className={cn(
                "font-bold border transition-all active:scale-[0.98] min-w-40",
                isDirty ? "border-primary-hover" : "border-border/60 opacity-80",
              )}
            >
              {saveLabel[saveState]}
            </Button>
            <ExportToDocsButton
              teamSlug={teamSlug}
              type="srs"
              onSuccess={handleCopyToDocsSuccess}
              className="shadow-sm"
            />
          </div>
        </div>

        <SrsMetadata
          version={String(editData.version ?? "1.0.0")}
          onVersionChange={handleVersionChange}
          frCount={requirements.fr.length}
          nfrCount={requirements.nfr.length}
        />

        {SECTION_GROUPS.map((group) => (
          <SrsSection
            key={group.number}
            group={group}
            editData={editData}
            teamSlug={teamSlug}
            onChange={handleField}
          />
        ))}

        <SrsRequirementsPreview
          number="4"
          title="Functional Requirements (FR)"
          icon="settings"
          requirements={requirements.fr}
          teamSlug={teamSlug}
          type="FR"
        />

        <SrsRequirementsPreview
          number="5"
          title="Non-Functional Requirements (NFR)"
          icon="shield"
          requirements={requirements.nfr}
          teamSlug={teamSlug}
          type="NFR"
        />

        {/* Info Box */}
        <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex gap-4 shadow-sm">
          <Lightbulb className="w-6 h-6 shrink-0 mt-0.5 text-blue-500" />
          <div className="space-y-1">
            <p className="text-sm font-bold">Tips Profesional:</p>
            <p className="text-sm leading-relaxed opacity-90">
              Dokumen SRS ini otomatis menyertakan FR dan NFR dari halaman
              Requirements. Gunakan tombol{" "}
              <span className="font-bold text-primary italic">
                ✨ AI Generate
              </span>{" "}
              di setiap field untuk menyusun draft konten yang cerdas
              berdasarkan deskripsi proyek Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Loader2, Settings, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  ProjectAccessSection,
  ProjectInfoSection,
  ProjectIntegrationsSection,
  ProjectSettingsAlerts,
  ProjectSettingsSaveButton,
  ProjectSettingsSidebar,
  type FormState,
  INITIAL_FORM,
  type ProjectSettingsTab,
} from "@/components/dashboard/settings";
import { useTeamSettings } from "@/hooks/useTeams";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const teamSlug = String(params?.teamSlug || "");
  const {
    settings,
    isLoading,
    isSaving,
    isDeleting,
    error,
    updateSettings,
    deleteTeam,
  } = useTeamSettings(teamSlug);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState("Terjadi Kesalahan");
  const [activeTab, setActiveTab] = useState<ProjectSettingsTab>("project");

  useEffect(() => {
    if (!settings) return;

    setForm({
      name: settings.name || "",
      slug: settings.slug || "",
      type: settings.type || "it",
      startDate: settings.startDate || "",
      endDate: settings.endDate || "",
      company: settings.company || "",
      workArea: settings.workArea || "",
      description: settings.description || "",
      githubRepo: settings.integrations?.githubRepo || "",
      googleDocsUrl: settings.integrations?.googleDocsUrl || "",
    });
  }, [settings]);

  useEffect(() => {
    if (!saveSuccess) return;

    const timeoutId = window.setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [saveSuccess]);

  const handleSave = async () => {
    setErrorTitle("Gagal Menyimpan");
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateSettings({
        name: form.name,
        slug: form.slug,
        type: form.type,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        company: form.company || undefined,
        workArea: form.workArea || undefined,
        description: form.description || undefined,
        integrations: {
          githubRepo: form.githubRepo || undefined,
          googleDocsUrl: form.googleDocsUrl || undefined,
        },
      });
      setSaveSuccess(true);
    } catch (saveErr) {
      setSaveError(
        saveErr instanceof Error
          ? saveErr.message
          : "Gagal menyimpan pengaturan.",
      );
    }
  };

  const handleDeleteProject = async () => {
    setErrorTitle("Gagal Menghapus Proyek");
    setSaveError(null);
    setSaveSuccess(false);

    const projectName = form.name || settings?.name || teamSlug;
    const shouldDelete = window.confirm(
      `Proyek \"${projectName}\" akan dihapus permanen dari database, termasuk issue dan anggota tim. Aksi ini tidak bisa dibatalkan. Lanjutkan?`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteTeam();
      router.push("/home");
      router.refresh();
    } catch (deleteErr) {
      setSaveError(
        deleteErr instanceof Error
          ? deleteErr.message
          : "Gagal menghapus proyek.",
      );
    }
  };

  if (!teamSlug) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <p className="text-text-muted">Tim tidak ditemukan.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-muted">Memuat pengaturan proyek...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background animate-fade-in overflow-y-auto overflow-x-hidden w-full">
      <div className="sticky top-0 z-50 bg-[hsl(var(--background))] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col justify-between items-start gap-4 border-b border-border shadow-sm">
        <div className="w-full">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-center gap-3 break-words">
            <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            Pengaturan Proyek
          </h1>
          <p className="text-text-muted mt-2 font-medium">
            Kelola identitas proyek, timeline, dan integrasi agar workspace tim
            tetap sinkron.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">
        <ProjectSettingsSidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          isDeleting={isDeleting}
          onDeleteProject={() => {
            void handleDeleteProject();
          }}
        />

        <div className="flex-1 max-w-4xl space-y-8">
          <ProjectSettingsAlerts
            error={error}
            saveError={saveError}
            saveSuccess={saveSuccess}
            errorTitle={errorTitle}
          />

          {activeTab === "project" && (
            <ProjectInfoSection form={form} setForm={setForm} />
          )}

          {activeTab === "integrations" && (
            <ProjectIntegrationsSection form={form} setForm={setForm} />
          )}

          {activeTab === "access" && <ProjectAccessSection />}

          {activeTab !== "access" && (
            <div className="flex justify-end pt-2">
              <ProjectSettingsSaveButton
                isSaving={isSaving}
                onSave={() => {
                  void handleSave();
                }}
              />
            </div>
          )}

          {/* Mobile-only Delete Button */}
          <div className="lg:hidden mt-8 pt-8 border-t border-border">
            <h3 className="text-xl font-extrabold text-priority-urgent mb-4">Zona Berbahaya</h3>
            <button
              onClick={() => void handleDeleteProject()}
              disabled={isDeleting}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-left bg-priority-urgent/10 border border-priority-urgent/20 text-priority-urgent hover:bg-priority-urgent/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="p-3 rounded-xl bg-priority-urgent text-white">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-extrabold text-base">Hapus Proyek</h4>
                <p className="text-xs font-semibold mt-1 opacity-80">
                  {isDeleting ? "Sedang menghapus..." : "Aksi ini tidak bisa dibatalkan"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

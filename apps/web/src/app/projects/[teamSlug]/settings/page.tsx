"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Loader2, Settings } from "lucide-react";
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
    <div className="h-full flex flex-col bg-background animate-fade-in overflow-y-auto w-full">
      <div className="sticky top-0 z-50 bg-[hsl(var(--background))] px-6 lg:px-8 py-6 flex flex-col justify-between items-start gap-4 border-b border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Pengaturan Proyek
          </h1>
          <p className="text-text-muted mt-2 font-medium">
            Kelola identitas proyek, timeline, dan integrasi agar workspace tim
            tetap sinkron.
          </p>
        </div>
      </div>

      <div className="p-6 lg:p-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
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
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Code,
  Briefcase,
  Calendar,
  Users,
  MapPin,
  FileText,
  Link as LinkIcon,
  GitBranch,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NewProjectFormData, StepIndicatorProps } from "@/types";
import { Dropdown } from "@/components/ui/Dropdown";
import { useAuth } from "@/hooks/useAuth";
import { teamsApi } from "@/lib/core";

export function NewProjectWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<NewProjectFormData>({
    name: "",
    slug: "",
    type: "it",
    startDate: "",
    endDate: "",
    company: "",
    workArea: "",
    description: "",
    googleDocsUrl: "",
    githubUrl: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" && prev.slug === ""
        ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }
        : {}),
    }));
  };

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      console.log("📝 Creating team with data:", formData);

      // Create team via API
      const team = await teamsApi.create({
        name: formData.name,
        slug: formData.slug.toUpperCase(),
        type: formData.type as "konstruksi" | "it" | "tugas",
      });

      console.log("Team created:", team);

      // Update team settings with additional info
      if (
        formData.startDate ||
        formData.endDate ||
        formData.company ||
        formData.workArea ||
        formData.description ||
        formData.githubUrl ||
        formData.googleDocsUrl
      ) {
        console.log("Updating team settings...");
        await teamsApi.updateSettings(team.slug, {
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          company: formData.company || undefined,
          workArea: formData.workArea || undefined,
          description: formData.description || undefined,
          integrations: {
            githubRepo: formData.githubUrl || undefined,
            googleDocsUrl: formData.googleDocsUrl || undefined,
          },
        });
        console.log("Team settings updated");
      }

      // Redirect to team page
      router.push(`/projects/${team.slug}`);
    } catch (err: any) {
      console.error("Error creating team:", err);
      setError(err.message || "Gagal membuat proyek. Silakan coba lagi.");
      setIsSubmitting(false);
    }
  };

  const isStep1Valid =
    formData.name &&
    formData.slug &&
    formData.startDate &&
    formData.endDate &&
    formData.company &&
    formData.workArea;

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 animate-fade-in space-y-8 sm:space-y-10 min-h-[calc(100vh-4rem)] overflow-x-hidden">
      {/* Header & Stepper */}
      <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-text tracking-tight mb-2">
            Inisiasi Proyek Baru
          </h1>
          <p className="text-text-muted font-medium max-w-lg leading-relaxed">
            Lengkapi konfigurasi dasar dan integrasikan aplikasi eksternal untuk
            mulai membangun workspace kolaboratif Anda.
          </p>
        </div>
        {/* Stepper Visual */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <StepIndicator
            stepNum={1}
            label="Informasi Pokok"
            isActive={step === 1}
            isCompleted={step > 1}
          />
          <div
            className={cn(
              "w-16 h-1 rounded-full transition-colors",
              step > 1 ? "bg-primary" : "bg-border",
            )}
          />
          <StepIndicator
            stepNum={2}
            label="Integrasi Tools"
            isActive={step === 2}
            isCompleted={false}
          />
        </div>
      </div>

      {/* Wizard Form Container */}
      <form
        onSubmit={
          step === 2
            ? handleSubmit
            : (e) => {
                e.preventDefault();
                handleNext();
              }
        }
        className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl relative overflow-hidden"
      >
        {step === 1 && (
          <div className="animate-fade-in space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 1. Nama & Slug */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-text ml-1 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-other" /> Nama Proyek
                  Utama <span className="text-priority-urgent">*</span>
                </label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  placeholder="Misal: Proyek Alpha Modernisasi"
                  className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-bold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-background shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text ml-1 flex items-center gap-2">
                  <Code className="w-4 h-4 text-other" /> Team Slug (URL ID){" "}
                  <span className="text-priority-urgent">*</span>
                </label>
                <input
                  required
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  type="text"
                  placeholder="proyek-alpha"
                  className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-bold text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-background shadow-inner"
                />
                <p className="text-[11px] font-semibold text-other ml-1 uppercase tracking-wider">
                  Preview: /projects/{formData.slug || "slug"}
                </p>
              </div>

              <div className="space-y-2 relative z-50">
                <label className="text-sm font-bold text-text ml-1 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-other" /> Kategori Proyek
                </label>
                <div className="relative w-full">
                  <Dropdown
                    align="left"
                    className="w-full"
                    reserveSpaceWhenOpen
                    trigger={
                      <button
                        type="button"
                        className="flex w-full items-center justify-between bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-bold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer bg-background shadow-inner hover:bg-muted/30"
                      >
                        {formData.type === "konstruksi"
                          ? "Konstruksi"
                          : formData.type === "it"
                            ? "IT / Software"
                            : formData.type === "tugas"
                              ? "Tugas Umum"
                              : "Pilih Kategori"}
                        <ChevronDown className="w-4 h-4 ml-2 text-text-muted" />
                      </button>
                    }
                    items={[
                      {
                        label: "Konstruksi",
                        onClick: () =>
                          setFormData((prev) => ({
                            ...prev,
                            type: "konstruksi",
                          })),
                      },
                      {
                        label: "IT / Software",
                        onClick: () =>
                          setFormData((prev) => ({ ...prev, type: "it" })),
                      },
                      {
                        label: "Tugas Umum",
                        onClick: () =>
                          setFormData((prev) => ({ ...prev, type: "tugas" })),
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-text ml-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-other" /> Timeline
                  Pelaksanaan <span className="text-priority-urgent">*</span>
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input
                    required
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    type="date"
                    className="w-full bg-transparent border border-border rounded-2xl px-4 py-4 text-sm font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-background shadow-inner"
                  />
                  <span className="text-text-muted font-bold hidden sm:block">
                    sampai
                  </span>
                  <input
                    required
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    type="date"
                    className="w-full bg-transparent border border-border rounded-2xl px-4 py-4 text-sm font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-background shadow-inner"
                  />
                </div>
              </div>

              {/* Company & Work Area */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-text ml-1 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-other" /> Afiliasi
                  Perusahaan <span className="text-priority-urgent">*</span>
                </label>
                <input
                  required
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  type="text"
                  placeholder="PT Kreatif Abadi"
                  className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-background shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text ml-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-other" /> Divisi / Work Area{" "}
                  <span className="text-priority-urgent">*</span>
                </label>
                <input
                  required
                  name="workArea"
                  value={formData.workArea}
                  onChange={handleChange}
                  type="text"
                  placeholder="Design & Engineering"
                  className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-background shadow-inner"
                />
              </div>

              {/* Read Only PM */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-text ml-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-other" /> Manajer Proyek
                  Spesifik
                </label>
                <div className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-4 flex items-center gap-3 cursor-not-allowed opacity-80 shadow-inner">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                    {user?.initials ||
                      user?.name?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text leading-tight">
                      {user?.name || "Loading..."}
                    </p>
                    <p className="text-[11px] font-semibold text-other uppercase tracking-wider">
                      Default Project Creator
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-text ml-1 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-other" /> Ringkasan Tujuan
                  (Opsional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Deskripsikan tujuan dan ruang lingkup proyek..."
                  className="w-full bg-transparent border border-border rounded-[20px] px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-sm leading-relaxed bg-background"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border gap-4">
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="w-full sm:w-auto font-bold text-text-muted hover:text-text px-4 py-3 sm:py-2 transition-colors text-center border border-transparent hover:bg-muted rounded-xl sm:rounded-none sm:hover:bg-transparent"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!isStep1Valid}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-muted disabled:text-text-subtle disabled:cursor-not-allowed text-primary-foreground font-bold px-8 py-4 rounded-xl transition-all shadow-md"
              >
                Konfigurasi Lanjut <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-8 relative z-10">
            {/* Error Message */}
            {error && (
              <div className="bg-priority-urgent/10 border border-priority-urgent/30 p-4 rounded-2xl flex gap-3 text-priority-urgent">
                <AlertCircleIcon className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Gagal Membuat Proyek</h4>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex gap-4 text-primary">
              <div className="mt-1">
                <AlertCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg mb-1">
                  Integrasi Sistem Opsional
                </h3>
                <p className="text-sm font-medium text-primary/80 leading-relaxed">
                  Hubungkan proyek Anda dengan tools produktivitas secara
                  real-time. Bagian ini dapat Anda lewati dan ditambahkan kapan
                  saja dari menu Pengaturan Proyek nanti.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* GitHub Connection */}
              <div className="border border-border rounded-3xl p-6 bg-background shadow-sm hover:border-primary/40 transition-colors group">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 bg-muted/80 flex items-center justify-center rounded-xl border border-border">
                    <GitBranch className="w-6 h-6 text-text" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-text">
                      GitHub Repository Source
                    </h4>
                    <p className="text-xs font-medium text-text-muted mt-1">
                      Sinkronisasi status commit, PR, dan branch aktivitas.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <input
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    type="url"
                    placeholder="https://github.com/organization/repo"
                    className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Google Docs */}
              <div className="border border-border rounded-3xl p-6 bg-background shadow-sm hover:border-ring/40 transition-colors group">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10/50 flex items-center justify-center rounded-xl border border-primary/20">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-text">
                      Google Docs Primer
                    </h4>
                    <p className="text-xs font-medium text-text-muted mt-1">
                      Dokumen panduan standar atau BRD produk sentral.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <input
                    name="googleDocsUrl"
                    value={formData.googleDocsUrl}
                    onChange={handleChange}
                    type="url"
                    placeholder="https://docs.google.com/document/d/..."
                    className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border gap-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto font-bold text-text-muted hover:text-text px-4 py-3 sm:py-2 transition-colors flex items-center justify-center gap-2 border border-transparent hover:bg-muted rounded-xl sm:rounded-none sm:hover:bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-8 py-4 rounded-xl transition-all shadow-md shadow-primary/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Menyiapkan
                    Environment...
                  </>
                ) : (
                  <>
                    Selesaikan & Buat Proyek{" "}
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function StepIndicator({
  stepNum,
  label,
  isActive,
  isCompleted,
}: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm border-2 transition-all",
          isActive
            ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30"
            : isCompleted
              ? "bg-primary/10 border-primary text-primary"
              : "bg-muted border-transparent text-text-muted",
        )}
      >
        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
      </div>
      <span
        className={cn(
          "text-xs font-bold uppercase tracking-wider",
          isActive
            ? "text-primary"
            : isCompleted
              ? "text-text"
              : "text-text-subtle",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

"use client";

import React, { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Paintbrush,
  Camera,
  LogOut,
  CheckCircle2,
  Edit2,
  Save,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { SettingsTabProps } from "@/types";
import { Dropdown } from "@/components/ui/Dropdown";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/core";
import { useRouter } from "next/navigation";

export function SystemSettings() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("Account");
  const [language, setLanguage] = useState("Bahasa Indonesia");
  const [timezone, setTimezone] = useState("Indonesia Barat (WIB) GMT+7");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    avatar: user?.avatar || "",
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await usersApi.updateMe({
        name: formData.name,
        avatar: formData.avatar || undefined,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refresh user data
      window.location.reload();
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="h-full flex flex-col bg-background animate-fade-in overflow-y-auto w-full">
      {/* Header Area */}
      <div className="sticky top-0 z-50 bg-[hsl(var(--background))] px-6 lg:px-8 py-6 flex flex-col justify-between items-start gap-4 border-b border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Pengaturan Sistem
          </h1>
          <p className="text-text-muted mt-2 font-medium">
            Kelola preferensi akun, tampilan antarmuka, dan sistem keamanan pada
            ruang kerja Anda.
          </p>
        </div>
      </div>

      <div className="p-6 lg:p-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Settings Navigation */}
        <div className="w-full lg:w-80 shrink-0 space-y-2">
          <SettingsTab
            icon={<User className="w-5 h-5" />}
            label="Profil Akun"
            description="Informasi dasar pribadi"
            active={activeTab === "Account"}
            onClick={() => setActiveTab("Account")}
          />
          <SettingsTab
            icon={<Paintbrush className="w-5 h-5" />}
            label="Tampilan & UI"
            description="Tema dan warna"
            active={activeTab === "Appearance"}
            onClick={() => setActiveTab("Appearance")}
          />
          <SettingsTab
            icon={<Bell className="w-5 h-5" />}
            label="Notifikasi"
            description="Pengaturan notifikasi otomatis"
            active={activeTab === "Notifications"}
            onClick={() => setActiveTab("Notifications")}
          />
          <SettingsTab
            icon={<Shield className="w-5 h-5" />}
            label="Keamanan"
            description="Password otentikasi"
            active={activeTab === "Security"}
            onClick={() => setActiveTab("Security")}
          />
          <div className="pt-6 mt-6 border-t border-border/60">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold text-priority-urgent hover:bg-priority-urgent/10 hover:text-priority-urgent transition-all text-left"
            >
              <div className="p-2.5 bg-priority-urgent/20 rounded-lg text-priority-urgent shadow-sm border border-priority-urgent/30">
                <LogOut className="w-5 h-5" />
              </div>
              Keluar Dari Sesi Akun
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-4xl">
          {activeTab === "Account" && (
            <div className="animate-fade-in space-y-8">
              {/* Success Message */}
              {saveSuccess && (
                <div className="bg-status-done/10 border border-status-done/30 p-4 rounded-2xl flex gap-3 text-status-done">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold mb-1">Profil Berhasil Disimpan</h4>
                    <p className="text-sm font-medium">
                      Perubahan Anda telah tersimpan di database
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-priority-urgent/10 border border-priority-urgent/30 p-4 rounded-2xl flex gap-3 text-priority-urgent">
                  <div className="w-5 h-5 mt-0.5 flex-shrink-0">⚠️</div>
                  <div>
                    <h4 className="font-bold mb-1">Gagal Menyimpan</h4>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Profile Card */}
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <h2 className="text-2xl font-extrabold text-text mb-8 relative z-10">
                  Informasi Pribadi & Publik
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-10 relative z-10">
                  <div className="relative group cursor-pointer w-fit">
                    <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center text-primary text-5xl font-extrabold border-4 border-background shadow-md overflow-hidden group-hover:opacity-80 transition-opacity">
                      {authLoading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.initials ||
                        user?.name?.charAt(0).toUpperCase() ||
                        "U"
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <Camera className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="absolute bottom-1 right-1 p-2 bg-background border border-border rounded-full shadow-sm text-text-subtle group-hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-text">
                      {authLoading ? "Loading..." : user?.name || "User"}
                    </h3>
                    <p className="text-sm font-bold text-primary mt-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg inline-block shadow-sm">
                      {authLoading ? "Loading..." : user?.email || ""}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text ml-1">
                      Nama Tampilan
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-bold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text ml-1">
                      Alamat Email Tertaut
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-bold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-text-muted disabled:opacity-50 disabled:bg-muted/30"
                      disabled
                    />
                    <p className="text-xs font-semibold text-text-subtle ml-1">
                      Email tidak dapat diubah
                    </p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-text ml-1">
                      Avatar URL (Opsional)
                    </label>
                    <input
                      type="url"
                      value={formData.avatar}
                      onChange={(e) =>
                        setFormData({ ...formData, avatar: e.target.value })
                      }
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-10 pt-8 border-t border-border relative z-10">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-primary/30"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" /> Simpan Profil
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preferences Card */}
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <h2 className="text-xl font-extrabold text-text mb-6">
                  Regional & Logis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text ml-1">
                      Bahasa Dasbor
                    </label>
                    <div className="relative">
                      <Dropdown
                        align="left"
                        trigger={
                          <button className="flex w-full items-center justify-between bg-transparent border border-border rounded-[16px] px-5 py-4 text-sm font-bold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer hover:bg-muted/30">
                            {language}
                            <ChevronDown className="w-4 h-4 ml-2 text-text-muted" />
                          </button>
                        }
                        items={[
                          {
                            label: "Bahasa Indonesia",
                            onClick: () => setLanguage("Bahasa Indonesia"),
                          },
                          {
                            label: "English (US)",
                            onClick: () => setLanguage("English (US)"),
                          },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text ml-1">
                      Zona Waktu Standar
                    </label>
                    <div className="relative">
                      <Dropdown
                        align="left"
                        trigger={
                          <button className="flex w-full items-center justify-between bg-transparent border border-border rounded-[16px] px-5 py-4 text-sm font-bold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer hover:bg-muted/30">
                            {timezone}
                            <ChevronDown className="w-4 h-4 ml-2 text-text-muted" />
                          </button>
                        }
                        items={[
                          {
                            label: "Indonesia Barat (WIB) GMT+7",
                            onClick: () =>
                              setTimezone("Indonesia Barat (WIB) GMT+7"),
                          },
                          {
                            label: "Indonesia Tengah (WITA) GMT+8",
                            onClick: () =>
                              setTimezone("Indonesia Tengah (WITA) GMT+8"),
                          },
                          {
                            label: "Indonesia Timur (WIT) GMT+9",
                            onClick: () =>
                              setTimezone("Indonesia Timur (WIT) GMT+9"),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-8 pt-8 border-t border-border">
                  <button className="flex items-center gap-2 bg-background border border-border hover:bg-muted text-text font-bold px-8 py-3.5 rounded-xl transition-all shadow-sm">
                    Terapkan Konfigurasi
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === "Appearance" && <ThemeSettings />}
          {activeTab !== "Account" && activeTab !== "Appearance" && (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted animate-fade-in border-2 border-dashed border-border rounded-[32px] bg-muted/20">
              <div className="w-24 h-24 bg-background border border-border rounded-3xl flex items-center justify-center shadow-lg mb-6">
                {activeTab === "Notifications" ? (
                  <Bell className="w-10 h-10 text-primary" />
                ) : null}
                {activeTab === "Security" ? (
                  <Shield className="w-10 h-10 text-priority-urgent" />
                ) : null}
              </div>
              <h3 className="text-2xl font-extrabold text-text mb-2">
                Segera Hadir
              </h3>
              <p className="text-sm font-semibold max-w-sm text-center">
                Modul menu{" "}
                <strong className="text-primary tracking-wide">
                  &quot;{activeTab}&quot;
                </strong>{" "}
                ini sedang dalam proses arsitektur untuk penyesuaian rilis mayor
                yang akan datang!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({
  icon,
  label,
  description,
  active,
  onClick,
}: SettingsTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all text-left group overflow-hidden relative",
        active
          ? "bg-primary/5 border-transparent shadow-sm"
          : "bg-transparent border-transparent hover:bg-muted/50",
      )}
    >
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></div>
      )}
      <div
        className={cn(
          "p-3 rounded-2xl transition-all shrink-0 z-10",
          active
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
            : "bg-card border border-border text-text-subtle group-hover:text-text group-hover:shadow-sm",
        )}
      >
        {icon}
      </div>
      <div className="z-10">
        <h4
          className={cn(
            "font-extrabold text-[16px]",
            active ? "text-primary" : "text-text",
          )}
        >
          {label}
        </h4>
        <p
          className={cn(
            "text-xs font-semibold mt-1",
            active ? "text-primary/70" : "text-text-muted",
          )}
        >
          {description}
        </p>
      </div>
      {active && (
        <CheckCircle2 className="w-5 h-5 text-primary ml-auto opacity-40 z-10" />
      )}
    </button>
  );
}

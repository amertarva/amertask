"use client";

import React from "react";
import Link from "next/link";
import {
  PlusCircle,
  Folder,
  Calendar,
  Activity,
  Zap,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTeams } from "@/hooks/useTeams";
import { useUserActivity } from "@/hooks/useUserActivity";
import { JoinTeamInviteAlert } from "@/components/dashboard/team/join/JoinTeamInviteAlert";

export function OnboardingHome() {
  const { user, status } = useAuthContext();
  const {
    teams,
    isLoading: teamsLoading,
    error: teamsError,
    isEmpty,
    refetch: refetchTeams,
  } = useTeams();
  const { data: activityData, isLoading: activityLoading } = useUserActivity();

  // Prepare activity data
  const activityMap = new Map<string, number>(
    (activityData?.activities ?? []).map((a) => [a.date, a.count]),
  );
  const activityStats = activityData?.stats ?? {
    totalLast30Days: 0,
    currentStreak: 0,
    dailyAverage: 0,
  };

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Auth is still being resolved, show a stable loading state instead of empty project state.
  if (status === "loading") {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-muted">Memuat data...</p>
        </div>
      </div>
    );
  }

  // AuthGate handles redirect globally, but keep component-safe null return.
  if (status !== "authenticated" || !user) {
    return null;
  }

  return (
    <div className="min-h-full flex flex-col p-6 lg:p-8 pb-24 animate-fade-in w-full space-y-10">
      <JoinTeamInviteAlert refreshTeams={refetchTeams} />

      {/* 1. Header Selamat Datang */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-border pb-8">
        <div>
          <h1
            className="text-3xl font-extrabold text-text tracking-tight animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Selamat datang, <span className="text-primary">{user.name}</span> 👋
          </h1>
          <p
            className="text-text-muted mt-2 font-medium flex items-center gap-2 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <Calendar className="w-4 h-4" /> {today}
          </p>
        </div>
      </section>

      {/* 2. Panel Proyek (Card Grid) */}
      <section
        className="space-y-6 animate-fade-in"
        style={{ animationDelay: "0.3s" }}
      >
        <h2 className="text-2xl font-extrabold text-text flex items-center gap-2">
          <Folder className="w-6 h-6 text-primary" /> Ruang Kerja Anda
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 — Buat Proyek Baru */}
          <Link href="/home/new-project" className="group h-full">
            <div className="h-full border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-sm hover:shadow-primary/20">
              <div className="w-16 h-16 bg-foreground/10 text-foreground rounded-2xl flex items-center justify-center shadow-sm border border-foreground/20 group-hover:scale-110 transition-transform mb-4 rotate-3 group-hover:rotate-6">
                <PlusCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-primary mb-2">
                Buat Proyek Baru
              </h3>
              <p className="text-sm font-semibold text-text-muted">
                Mulai dari awal dengan konfigurasi lengkap.
              </p>
            </div>
          </Link>

          {/* Card 2 — Proyek Existing (Real Data) */}
          {teamsLoading ? (
            <div className="h-full border border-border bg-card rounded-3xl p-8 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                <p className="text-sm text-text-muted">Memuat proyek...</p>
              </div>
            </div>
          ) : teamsError ? (
            <div className="h-full border border-border bg-card rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-priority-urgent/20 text-priority-urgent rounded-full flex items-center justify-center mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">
                Gagal Memuat Proyek
              </h3>
              <p className="text-sm text-text-muted mb-4">{teamsError}</p>
              <button
                type="button"
                onClick={() => {
                  void refetchTeams();
                }}
                className="mb-3 text-sm font-semibold text-text hover:text-primary transition-colors"
              >
                Muat Ulang Data Tim
              </button>
              <Link
                href="/home/new-project"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Buat Proyek Baru →
              </Link>
            </div>
          ) : teams && teams.length > 0 ? (
            <Link href={`/projects/${teams[0].slug}`} className="group h-full">
              <div className="h-full border border-border bg-card rounded-3xl p-8 transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-text group-hover:text-primary transition-colors">
                      {teams[0].name}
                    </h3>
                    <p className="text-xs font-bold text-text-muted mt-1 bg-muted px-2 py-1 rounded inline-block">
                      #{teams[0].slug}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-accent/20 text-accent text-xs font-bold rounded-lg border border-accent/40">
                    {teams[0].role === "owner"
                      ? "Owner"
                      : teams[0].role === "admin"
                        ? "Admin"
                        : teams[0].role === "pm"
                          ? "PM"
                          : "Member"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                  <div className="bg-background rounded-xl p-3 border border-border shadow-inner">
                    <p className="text-[10px] uppercase font-bold text-text-subtle mb-1">
                      Status
                    </p>
                    <p className="text-sm font-extrabold text-status-done flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-status-done animate-pulse"></span>{" "}
                      Aktif
                    </p>
                  </div>
                  <div className="bg-background rounded-xl p-3 border border-border shadow-inner">
                    <p className="text-[10px] uppercase font-bold text-text-subtle mb-1">
                      Role
                    </p>
                    <p className="text-xs font-bold text-text capitalize">
                      {teams[0].role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    {teams[0].avatar ? (
                      <img
                        src={teams[0].avatar}
                        alt={teams[0].name}
                        className="w-8 h-8 rounded-full border border-primary/30"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center border border-primary/30">
                        {teams[0].name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-bold text-text-muted">
                      {teams[0].name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Kelola &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ) : isEmpty ? (
            <div className="h-full border border-border bg-card rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              <Folder className="w-12 h-12 text-text-muted mb-4" />
              <h3 className="text-lg font-bold text-text mb-2">
                Belum Ada Proyek
              </h3>
              <p className="text-sm text-text-muted">
                Buat proyek pertama Anda untuk memulai
              </p>
              <button
                type="button"
                onClick={() => {
                  void refetchTeams();
                }}
                className="mt-4 text-sm font-semibold text-primary hover:underline"
              >
                Cek Ulang Proyek
              </button>
            </div>
          ) : null}
        </div>

        {/* Show more teams if available */}
        {teams && teams.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {teams.slice(1, 4).map((team) => (
              <Link
                key={team.id}
                href={`/projects/${team.slug}`}
                className="group border border-border bg-card rounded-2xl p-6 hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  {team.avatar ? (
                    <img
                      src={team.avatar}
                      alt={team.name}
                      className="w-10 h-10 rounded-full border border-primary/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center border border-primary/30">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-text group-hover:text-primary transition-colors truncate">
                      {team.name}
                    </h4>
                    <p className="text-xs text-text-muted">#{team.slug}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                  {team.role}
                </span>
              </Link>
            ))}
          </div>
        )}

        {teams && teams.length > 4 && (
          <div className="text-center">
            <p className="text-sm text-text-muted">
              Dan {teams.length - 4} proyek lainnya
            </p>
          </div>
        )}
      </section>

      {/* 3. Ringkasan Aktivitas 30 Hari Terakhir */}
      <section
        className="space-y-6 animate-fade-in"
        style={{ animationDelay: "0.4s" }}
      >
        <h2 className="text-2xl font-extrabold text-text flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" /> Riwayat Aktivitas Ops
        </h2>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
          {/* Heatmap Area (Mock) - GitHub Style */}
          <div className="flex flex-col xl:flex-row gap-8 items-start">
            {/* Graph Container */}
            <div className="flex-1 overflow-x-auto pb-4">
              <div className="min-w-[850px] inline-flex flex-col">
                {/* Month Labels */}
                <div className="flex ml-9 text-[11px] text-text-muted font-medium mb-1 relative h-4">
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "Mei",
                    "Jun",
                    "Jul",
                    "Agu",
                    "Sep",
                    "Okt",
                    "Nov",
                    "Des",
                  ].map((m, i) => (
                    <span
                      key={i}
                      className="absolute"
                      style={{ left: `${i * 68.3}px` }}
                    >
                      {m}
                    </span>
                  ))}
                </div>

                <div className="flex">
                  {/* Day Labels */}
                  <div className="flex flex-col gap-[3px] text-[10px] text-text-muted font-medium mr-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <div
                        key={day}
                        className="h-3.25 flex items-center justify-end w-7 leading-none"
                      >
                        {day === 1
                          ? "Sen"
                          : day === 3
                            ? "Rab"
                            : day === 5
                              ? "Jum"
                              : ""}
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  {activityLoading ? (
                    <div className="flex items-center justify-center w-full h-24">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="flex gap-0.75">
                      {Array.from({ length: 52 }).map((_, weekIndex) => (
                        <div
                          key={weekIndex}
                          className="flex flex-col gap-0.75"
                        >
                          {Array.from({ length: 7 }).map((_, dayIndex) => {
                            const d = new Date();
                            d.setDate(
                              d.getDate() -
                                (51 - weekIndex) * 7 -
                                (6 - dayIndex),
                            );
                            const dateStr = d.toISOString().slice(0, 10);
                            const count = activityMap.get(dateStr) ?? 0;

                            // Level intensitas 0-4
                            const level =
                              count === 0
                                ? 0
                                : count <= 2
                                  ? 1
                                  : count <= 4
                                    ? 2
                                    : count <= 6
                                      ? 3
                                      : 4;

                            const colorClass = [
                              "bg-black/5 dark:bg-card/5 border-black/5 dark:border-primary-foreground/5",
                              "bg-[#c6e48b] border-[#c6e48b] dark:bg-[#0e4429] dark:border-[#0e4429]",
                              "bg-[#7bc96f] border-[#7bc96f] dark:bg-[#006d32] dark:border-[#006d32]",
                              "bg-[#239a3b] border-[#239a3b] dark:bg-[#26a641] dark:border-[#26a641]",
                              "bg-[#196127] border-[#196127] dark:bg-[#39d353] dark:border-[#39d353]",
                            ][level];

                            return (
                              <div
                                key={dayIndex}
                                className={`w-3.25 h-[13px] rounded-[2px] border ${colorClass} hover:ring-1 hover:ring-text transition-all cursor-crosshair`}
                                title={
                                  count > 0
                                    ? `${dateStr}: ${count} aktivitas`
                                    : dateStr
                                }
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex justify-between items-center mt-4 ml-9 w-[829px]">
                  <span className="text-[11px] text-text-muted font-medium hover:text-primary transition-colors cursor-pointer">
                    Pelajari bagaimana kami mengkalkulasi kontribusi
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted font-medium">
                    <span>Lebih Sedikit</span>
                    <div className="flex gap-[3px]">
                      <div className="w-[13px] h-[13px] rounded-[2px] bg-black/5 border-black/5 dark:bg-card/5 dark:border-primary-foreground/5 border"></div>
                      <div className="w-[13px] h-[13px] rounded-[2px] bg-[#c6e48b] border-[#c6e48b] dark:bg-[#0e4429] dark:border-[#0e4429] border"></div>
                      <div className="w-[13px] h-[13px] rounded-[2px] bg-[#7bc96f] border-[#7bc96f] dark:bg-[#006d32] dark:border-[#006d32] border"></div>
                      <div className="w-[13px] h-[13px] rounded-[2px] bg-[#239a3b] border-[#239a3b] dark:bg-[#26a641] dark:border-[#26a641] border"></div>
                      <div className="w-[13px] h-[13px] rounded-[2px] bg-[#196127] border-[#196127] dark:bg-[#39d353] dark:border-[#39d353] border"></div>
                    </div>
                    <span>Lebih Banyak</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Year Selector */}
            <div className="w-full xl:w-32 flex flex-row xl:flex-col gap-2 shrink-0 pt-4 xl:pt-0 overflow-x-auto no-scrollbar">
              <button className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg shadow-sm whitespace-nowrap text-left w-full border border-primary dark:border-transparent transition-all">
                2026
              </button>
              <button className="px-4 py-2 text-sm font-bold text-text hover:bg-muted rounded-lg transition-colors whitespace-nowrap text-left hover:text-primary w-full">
                2025
              </button>
              <button className="px-4 py-2 text-sm font-bold text-text hover:bg-muted rounded-lg transition-colors whitespace-nowrap text-left hover:text-primary w-full">
                2024
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="flex items-center gap-4 bg-background border border-border p-4 rounded-2xl shadow-inner">
              <div className="w-12 h-12 bg-status-done/20 text-status-done rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-text-muted">
                  Total Tugas 30 Hari
                </p>
                <p className="text-2xl font-extrabold text-text">
                  {activityStats.totalLast30Days}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-background border border-border p-4 rounded-2xl shadow-inner">
              <div className="w-12 h-12 bg-priority-high/20 text-priority-high rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-text-muted">
                  Current Streak
                </p>
                <p className="text-2xl font-extrabold text-text">
                  {activityStats.currentStreak}{" "}
                  <span className="text-sm">Hari</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-background border border-border p-4 rounded-2xl shadow-inner">
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-text-muted">
                  Rata-Rata Harian
                </p>
                <p className="text-2xl font-extrabold text-text">
                  {activityStats.dailyAverage}{" "}
                  <span className="text-sm">Akt/hari</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

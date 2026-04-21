"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  ShieldCheck,
  UserPlus2,
  X,
} from "lucide-react";
import { ApiError, teamsApi } from "@/lib/core";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";

type InvitePreview = {
  team: {
    id: string;
    slug: string;
    name: string;
  };
  role: "admin" | "member" | "pm";
  expiresAt: string | null;
  alreadyMember: boolean;
  existingRole: string | null;
};

interface JoinTeamInviteAlertProps {
  onJoined?: (teamSlug: string) => Promise<void> | void;
  refreshTeams?: () => Promise<void>;
}

const ROLE_LABEL: Record<InvitePreview["role"], string> = {
  admin: "Admin",
  member: "Member",
  pm: "PM",
};

export function JoinTeamInviteAlert({
  onJoined,
  refreshTeams,
}: JoinTeamInviteAlertProps) {
  const { colorTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const inviteToken = useMemo(
    () => searchParams?.get("invite") || "",
    [searchParams],
  );

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDarkMode =
    colorTheme === "amerta-night" ||
    (typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"));

  const clearInviteParam = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams?.toString() || "");
    nextParams.delete("invite");

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    router.replace(nextUrl);
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!inviteToken) {
      setPreview(null);
      setError(null);
      setIsLoadingPreview(false);
      return;
    }

    let isCancelled = false;

    const runPreview = async () => {
      setIsLoadingPreview(true);
      setError(null);

      try {
        const data = await teamsApi.previewInvite(inviteToken);

        if (isCancelled) return;
        setPreview(data);
      } catch (err) {
        if (isCancelled) return;

        const message =
          err instanceof ApiError
            ? err.message
            : "Gagal memuat informasi undangan tim";

        setError(message);
      } finally {
        if (!isCancelled) {
          setIsLoadingPreview(false);
        }
      }
    };

    void runPreview();

    return () => {
      isCancelled = true;
    };
  }, [inviteToken]);

  if (!inviteToken) {
    return null;
  }

  const handleReject = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      await teamsApi.rejectInvite(inviteToken);
      clearInviteParam();
      setPreview(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal menolak undangan";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccept = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const data = await teamsApi.acceptInvite(inviteToken);

      if (refreshTeams) {
        await refreshTeams();
      }

      if (onJoined) {
        await onJoined(data.team.slug);
      }

      clearInviteParam();
      router.push(`/projects/${data.team.slug}`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal menerima undangan";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const expiredText = preview?.expiresAt
    ? new Date(preview.expiresAt).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Tidak diketahui";

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-100 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in text-left",
        isDarkMode ? "bg-black/70" : "bg-black/40",
      )}
    >
      <div
        className={cn(
          "w-full max-w-xl rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl",
          isDarkMode
            ? "bg-background-secondary border border-border/70"
            : "bg-white border border-slate-200",
        )}
      >
        <div className="flex items-start justify-between px-8 pt-8 pb-4">
          <div className="flex gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary shrink-0">
              <UserPlus2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-2xl text-text">
                Undangan Bergabung Tim
              </h3>
              <p className="text-text-muted text-sm mt-1">
                Anda menerima undangan untuk bergabung ke ruang kerja.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearInviteParam}
            className="rounded-full text-text-muted hover:text-text"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div
          className={cn(
            "mx-8 border-b",
            isDarkMode ? "border-border/60" : "border-slate-200",
          )}
        />

        <div className="px-8 py-4 flex flex-col gap-6 overflow-y-auto max-h-[60vh]">
          {isLoadingPreview ? (
            <div
              className={cn(
                "rounded-xl p-4 text-sm",
                isDarkMode
                  ? "bg-background border border-input text-text-muted"
                  : "bg-slate-50 border border-slate-200 text-text-muted",
              )}
            >
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memeriksa detail undangan...
              </div>
            </div>
          ) : preview ? (
            <>
              <div
                className={cn(
                  "rounded-xl p-4 border",
                  isDarkMode
                    ? "bg-background border-border/60"
                    : "bg-slate-50 border-slate-200",
                )}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
                  Tim
                </p>
                <p className="mt-1 text-base font-bold text-text">
                  {preview.team.name}
                </p>
                <p className="text-xs text-text-muted">#{preview.team.slug}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div
                  className={cn(
                    "rounded-xl p-3 border",
                    isDarkMode
                      ? "bg-background border-border/60"
                      : "bg-slate-50 border-slate-200",
                  )}
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
                    Role
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {ROLE_LABEL[preview.role]}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-xl p-3 border",
                    isDarkMode
                      ? "bg-background border-border/60"
                      : "bg-slate-50 border-slate-200",
                  )}
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
                    Berlaku sampai
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {expiredText}
                  </p>
                </div>
              </div>

              {preview.alreadyMember ? (
                <div className="rounded-xl border border-status-done/40 bg-status-done/10 p-3 text-sm text-status-done">
                  Anda sudah menjadi anggota tim ini sebagai{" "}
                  {preview.existingRole || "member"}.
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-priority-urgent/40 bg-priority-urgent/10 p-4 text-sm text-priority-urgent">
              Detail undangan tidak ditemukan.
            </div>
          )}

          {error ? (
            <div className="rounded-xl border border-priority-urgent/40 bg-priority-urgent/10 p-3 text-sm font-medium text-priority-urgent">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "px-8 py-5 border-t flex justify-end gap-3 mt-auto rounded-b-2xl",
            isDarkMode
              ? "border-border/60 bg-background-tertiary/80"
              : "border-slate-200 bg-slate-50",
          )}
        >
          <Button
            variant="secondary"
            onClick={handleReject}
            disabled={isProcessing}
            className={cn(
              "px-6 text-text font-semibold",
              isDarkMode
                ? "bg-muted hover:bg-muted/80"
                : "bg-slate-100 hover:bg-slate-200",
            )}
          >
            Tolak
          </Button>
          <Button
            variant="primary"
            onClick={handleAccept}
            disabled={isProcessing || isLoadingPreview || !preview}
            className="px-6 font-bold shadow-lg shadow-primary/20"
            leftIcon={
              isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )
            }
          >
            {preview?.alreadyMember ? "Buka Tim" : "Terima"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

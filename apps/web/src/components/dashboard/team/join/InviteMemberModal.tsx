"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  CheckCircle2,
  Copy,
  Link2,
  Loader2,
  UserPlus2,
  X,
} from "lucide-react";
import { ApiError, teamsApi } from "@/lib/core";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";

type TeamInviteRole = "admin" | "member" | "pm";

interface InviteMemberModalProps {
  isOpen: boolean;
  teamSlug: string;
  onClose: () => void;
}

const EXPIRY_OPTIONS = [
  { value: 24, label: "24 jam" },
  { value: 72, label: "3 hari" },
  { value: 168, label: "7 hari" },
];

export function InviteMemberModal({
  isOpen,
  teamSlug,
  onClose,
}: InviteMemberModalProps) {
  const { colorTheme } = useThemeStore();
  const [expiresInHours, setExpiresInHours] = useState<number>(72);
  const [inviteUrl, setInviteUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const inviteRole: TeamInviteRole = "member";

  const isDarkMode =
    colorTheme === "amerta-night" ||
    (typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"));

  const expiryLabel = useMemo(() => {
    return (
      EXPIRY_OPTIONS.find((option) => option.value === expiresInHours)?.label ||
      "Custom"
    );
  }, [expiresInHours]);

  if (!isOpen) {
    return null;
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setIsCopied(false);

    try {
      const response = await teamsApi.createInvite(teamSlug, {
        role: inviteRole,
        expiresInHours,
      });

      setInviteUrl(response.inviteUrl);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal membuat link undangan";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl || isCopying) return;

    setIsCopying(true);
    setError(null);

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
    } catch {
      setError("Gagal menyalin link. Salin manual dari kolom link.");
    } finally {
      setIsCopying(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setIsCopied(false);
    onClose();
  };

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
          "w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl",
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
                Tambah Anggota{" "}
              </h3>
              <p className="text-text-muted text-sm mt-1">
                Buat link undangan untuk tim #{teamSlug.toUpperCase()}.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wide text-text-muted">
                Role anggota
              </span>
              <div
                className={cn(
                  "w-full rounded-xl px-3 py-2 text-sm font-semibold",
                  isDarkMode
                    ? "bg-background border border-input text-text"
                    : "bg-white border border-slate-200 text-text",
                )}
              >
                Member
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wide text-text-muted">
                Masa berlaku
              </span>
              <Dropdown
                align="left"
                className="w-full"
                reserveSpaceWhenOpen
                trigger={
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium outline-none transition-all cursor-pointer",
                      isDarkMode
                        ? "bg-background border border-input text-text hover:bg-muted/30"
                        : "bg-white border border-slate-200 text-text hover:bg-muted/30",
                    )}
                  >
                    {expiryLabel}
                    <ChevronDown className="w-4 h-4 ml-2 text-text-muted" />
                  </button>
                }
                items={EXPIRY_OPTIONS.map((option) => ({
                  label: option.label,
                  onClick: () => setExpiresInHours(option.value),
                }))}
              />
            </div>
          </div>

          <div
            className={cn(
              "rounded-xl p-4 border",
              isDarkMode
                ? "bg-background border-border/60"
                : "bg-slate-50 border-slate-200",
            )}
          >
            <p className="text-sm text-text-muted">
              Link akan berlaku selama{" "}
              <span className="font-semibold text-text">{expiryLabel}</span> dan
              saat dibuka user akan diminta login/daftar terlebih dahulu.
            </p>
          </div>

          {inviteUrl ? (
            <div className="space-y-2 rounded-xl border border-status-done/40 bg-status-done/10 p-4">
              <div className="flex items-center gap-2 text-status-done">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-semibold">
                  Link undangan berhasil dibuat
                </p>
              </div>
              <input
                value={inviteUrl}
                readOnly
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-xs",
                  isDarkMode
                    ? "bg-background border border-input text-text"
                    : "bg-white border border-slate-200 text-text",
                )}
              />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-priority-urgent/40 bg-priority-urgent/10 p-3 text-sm font-medium text-priority-urgent">
              {error}
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
            onClick={handleClose}
            className={cn(
              "px-6 text-text font-semibold",
              isDarkMode
                ? "bg-muted hover:bg-muted/80"
                : "bg-slate-100 hover:bg-slate-200",
            )}
          >
            Batal
          </Button>
          <Button
            variant="ghost"
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              "px-6 font-semibold border",
              isDarkMode
                ? "bg-background border-input text-text hover:bg-muted"
                : "bg-white border-slate-200 text-text hover:bg-slate-100",
            )}
            leftIcon={
              isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )
            }
          >
            {isGenerating ? "Membuat Link..." : "Generate Link"}
          </Button>
          <Button
            variant="primary"
            onClick={handleCopy}
            disabled={!inviteUrl || isCopying}
            className="px-6 font-bold shadow-lg shadow-primary/20"
            leftIcon={
              isCopying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Copy className="w-4 h-4" />
              )
            }
          >
            {isCopied ? "Tersalin" : "Salin Link"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Info } from "lucide-react";
import type { GoogleDocsUrlModalProps } from "@/types/components/GoogleDocsUrlModalProps";
import { useThemeStore } from "@/store/useThemeStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function GoogleDocsUrlModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  isLoading = false,
}: GoogleDocsUrlModalProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { colorTheme } = useThemeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (
    colorTheme === "amerta-night" ||
    (typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"))
  );

  const validateGoogleDocsUrl = (url: string): boolean => {
    const googleDocsPattern =
      /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9-_]+/;
    return googleDocsPattern.test(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("URL Google Docs wajib diisi");
      return;
    }

    if (!validateGoogleDocsUrl(url)) {
      setError("URL harus berupa link Google Docs yang valid");
      return;
    }

    onSubmit(url.trim());
  };

  const handleClose = () => {
    setUrl("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in text-left",
        isDarkMode ? "bg-black/70" : "bg-black/40",
      )}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl transition-all duration-300",
          isDarkMode
            ? "bg-background-secondary border border-border/70"
            : "bg-white border border-slate-200",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <h2
            className={cn(
              "text-lg font-extrabold tracking-tight",
              isDarkMode ? "text-text" : "text-slate-900"
            )}
          >
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full text-text-muted hover:text-text hover:bg-muted/50 transition-all active:scale-95"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div
          className={cn(
            "mx-6 border-b",
            isDarkMode ? "border-border/60" : "border-slate-100",
          )}
        />

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <p
              className={cn(
                "text-sm leading-relaxed",
                isDarkMode ? "text-text-muted" : "text-slate-600"
              )}
            >
              {description}
            </p>

            {/* Info Box */}
            <div
              className={cn(
                "border rounded-xl p-4 transition-all duration-200",
                isDarkMode
                  ? "bg-primary/5 border-primary/20 text-text-muted"
                  : "bg-primary/5 border-primary/10 text-slate-700"
              )}
            >
              <div className="flex items-start space-x-3">
                <div className="p-1 rounded-lg bg-primary/10 text-primary">
                  <Info className="w-4 h-4 flex-shrink-0" />
                </div>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-text mb-1.5">
                    Cara mendapatkan URL Google Docs:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-text-subtle font-medium">
                    <li>Buka Google Docs dan buat dokumen baru</li>
                    <li>Klik "Bagikan" di pojok kanan atas</li>
                    <li>
                      Ubah akses menjadi "Siapa saja yang memiliki link dapat
                      mengedit"
                    </li>
                    <li>Salin link dan paste di sini</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="googleDocsUrl"
                className={cn(
                  "block text-sm font-bold ml-1",
                  isDarkMode ? "text-text" : "text-slate-700"
                )}
              >
                URL Google Docs
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="googleDocsUrl"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  className={cn(
                    "w-full pl-4 pr-10 py-3 text-sm font-semibold rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:border-primary/60",
                    isDarkMode
                      ? "bg-background border border-input placeholder:text-text-subtle/70"
                      : "bg-white border border-slate-200 placeholder:text-slate-400 hover:border-slate-300",
                    error && (isDarkMode ? "border-red-500/70 focus-visible:ring-red-500/30" : "border-red-300 focus-visible:ring-red-500/20")
                  )}
                  disabled={isLoading}
                />
                <ExternalLink className="absolute right-3.5 top-3.5 w-4 h-4 text-text-muted/70" />
              </div>
              {error && (
                <p className="text-xs font-semibold text-red-500 ml-1 animate-pulse">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className={cn(
                "px-5 h-11 text-text font-bold rounded-xl transition-all duration-150 active:scale-95",
                isDarkMode
                  ? "bg-muted/70 hover:bg-muted"
                  : "bg-slate-100 hover:bg-slate-200",
              )}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className={cn(
                "px-5 h-11 font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                isDarkMode ? "border border-primary/30" : "border border-primary/20"
              )}
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? "Menyimpan..." : "Simpan & Copy"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


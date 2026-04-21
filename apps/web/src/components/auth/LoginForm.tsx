"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type SnackbarState = {
  message: string;
  type: "success" | "error";
} | null;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const expiredNoticeShownRef = useRef(false);

  const nextPath = useMemo(() => {
    const next = searchParams?.get("next")?.trim() || "";

    if (!next) return "/home";
    if (!next.startsWith("/") || next.startsWith("//")) return "/home";

    return next;
  }, [searchParams]);

  const registerHref = useMemo(
    () => `/auth/register?next=${encodeURIComponent(nextPath)}`,
    [nextPath],
  );

  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("rememberedEmail") ?? "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("rememberedEmail"));
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const sanitizeInput = (input: string): string =>
    input
      .replace(/<[^>]*>/g, "")
      .replace(/[{};:']/g, "")
      .trim();

  const showNotification = useCallback(
    (message: string, type: "success" | "error") => {
      setSnackbar({ message, type });
    },
    [],
  );

  useEffect(() => {
    const expired = searchParams?.get("expired");
    if (
      (expired === "1" || expired === "true") &&
      !expiredNoticeShownRef.current
    ) {
      expiredNoticeShownRef.current = true;
      const timer = window.setTimeout(() => {
        showNotification(
          "Sesi anda telah berakhir, silakan masuk kembali",
          "error",
        );
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [searchParams, showNotification]);

  useEffect(() => {
    if (!snackbarVisible) return;

    const timer = window.setTimeout(() => {
      setSnackbarVisible(false);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [snackbarVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedEmail || !sanitizedPassword) {
      showNotification("Email dan kata sandi harus diisi", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email: sanitizedEmail, password: sanitizedPassword });

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", sanitizedEmail);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      showNotification(
        "Login berhasil! Mengarahkan ke dashboard...",
        "success",
      );

      setTimeout(() => {
        router.push(nextPath);
      }, 1500);
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Terjadi kesalahan saat login",
        "error",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-16 top-12 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl"
          aria-hidden
        />
      </div>

      <div className="max-w-md w-full backdrop-blur-sm rounded-2xl p-8 transform transition-all duration-300">
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="w-30 h-30 mx-auto rounded-full bg-primary flex items-center justify-center border-4 border-background text-primary-foreground font-black text-5xl">
              A
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Selamat Datang
          </h1>
          <p className="text-foreground text-sm">
            Masuk dan kelola ruang kerja setiap hari!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label
              htmlFor="admin-email"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-5 h-5" />
              <input
                type="email"
                id="admin-email"
                value={email}
                onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                required
                disabled={isSubmitting}
                className="pl-12 pr-4 py-3 w-full border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-muted/30 hover:bg-card disabled:opacity-60 disabled:cursor-not-allowed text-text"
                placeholder="Masukkan email Anda"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="relative">
            <label
              htmlFor="admin-password"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                id="admin-password"
                value={password}
                onChange={(e) => setPassword(sanitizeInput(e.target.value))}
                required
                disabled={isSubmitting}
                className="pl-12 pr-12 py-3 w-full border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-muted/30 hover:bg-card disabled:opacity-60 disabled:cursor-not-allowed text-text"
                placeholder="Masukkan kata sandi"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors duration-200"
                tabIndex={-1}
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="admin-remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4 text-primary focus:ring-primary border-border rounded bg-background"
            />
            <label
              htmlFor="admin-remember-me"
              className="ml-2 block text-sm text-foreground"
            >
              Ingat saya
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-linear-to-r from-primary to-accent text-primary-foreground py-3 px-4 rounded-xl font-semibold transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>
        <div className="mt-8 text-center text-sm text-foreground">
          Belum mendaftar?{" "}
          <a
            href={registerHref}
            className="font-bold text-primary hover:underline"
          >
            Buat akun dari sini
          </a>
        </div>
      </div>

      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 transform transition-all duration-500 z-50 ${
          snackbarVisible
            ? "translate-y-0 opacity-100 scale-100"
            : "-translate-y-6 opacity-0 scale-95"
        } ${
          snackbar?.type === "success"
            ? "bg-status-done text-primary-foreground border-status-done"
            : snackbar?.type === "error"
              ? "bg-priority-urgent text-primary-foreground border-priority-urgent"
              : "bg-other text-primary-foreground border-other"
        } px-6 py-4 rounded-2xl shadow-2xl border-2 pointer-events-none max-w-sm`}
        aria-live="assertive"
        role="alert"
      >
        <div className="flex items-center gap-3">
          {snackbar?.type === "error" && (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          {snackbar?.type === "success" && (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
          <div className="font-medium text-sm leading-relaxed">
            {snackbar?.message}
          </div>
        </div>
      </div>
    </div>
  );
}

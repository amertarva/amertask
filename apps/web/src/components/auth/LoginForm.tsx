"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
      setSnackbarVisible(true);
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
          className="absolute -left-16 top-12 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute bottom-0 right-0 h-[32rem] w-[32rem] rounded-full bg-secondary/10 blur-3xl"
          aria-hidden
        />
      </div>

      <div className="relative max-w-md w-full bg-card/60 backdrop-blur-xl rounded-2xl p-8 transform transition-all duration-300">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/company-logos/amertask.svg"
              alt="Amertask Logo"
              width={64}
              height={64}
              className="h-16 w-auto drop-shadow-sm"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-foreground">
            Selamat Datang
          </h1>
          <p className="text-foreground-muted text-sm">
            Masuk dan kelola ruang kerja setiap hari!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="admin-email"
            type="email"
            label="Email Kerja"
            placeholder="Masukkan email Anda"
            value={email}
            onChange={(e) => setEmail(sanitizeInput(e.target.value))}
            required
            disabled={isSubmitting}
            leftIcon={<Mail className="w-5 h-5" />}
            autoComplete="email"
            className="bg-background/80 border-border focus:border-primary/50"
          />

          <Input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            label="Kata Sandi"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => setPassword(sanitizeInput(e.target.value))}
            required
            disabled={isSubmitting}
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-foreground transition-colors duration-200 flex items-center justify-center p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                tabIndex={-1}
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            autoComplete="current-password"
            className="bg-background/80 border-border focus:border-primary/50"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="admin-remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded bg-background accent-primary cursor-pointer"
              />
              <label
                htmlFor="admin-remember-me"
                className="ml-2 block text-sm text-foreground-muted cursor-pointer hover:text-foreground transition-colors"
              >
                Ingat saya
              </label>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="secondary"
              isLoading={isSubmitting}
              className="w-full h-12 text-base rounded-xl font-bold shadow-lg shadow-secondary/20 transition-all duration-300 transform active:scale-[0.98]"
            >
              Masuk
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-foreground-muted">
          Belum mendaftar?{" "}
          <a
            href={registerHref}
            className="font-semibold text-primary hover:text-primary-hover transition-colors duration-200"
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
        } px-6 py-4 rounded-xl shadow-2xl border pointer-events-none max-w-sm`}
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

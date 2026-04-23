"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type SnackbarState = {
  message: string;
  type: "success" | "error";
} | null;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const nextPath = useMemo(() => {
    const next = searchParams?.get("next")?.trim() || "";

    if (!next) return "/home";
    if (!next.startsWith("/") || next.startsWith("//")) return "/home";

    return next;
  }, [searchParams]);

  const loginHref = useMemo(
    () => `/auth/login?next=${encodeURIComponent(nextPath)}`,
    [nextPath],
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const snackbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSnackbarTimer = useCallback(() => {
    if (snackbarTimerRef.current) {
      clearTimeout(snackbarTimerRef.current);
      snackbarTimerRef.current = null;
    }
  }, []);

  const sanitizeInput = (input: string): string =>
    input
      .replace(/<[^>]*>/g, "")
      .replace(/[{};:']/g, "")
      .trim();

  const showNotification = useCallback(
    (message: string, type: "success" | "error") => {
      clearSnackbarTimer();
      setSnackbar({ message, type });
      setSnackbarVisible(true);

      snackbarTimerRef.current = setTimeout(() => {
        setSnackbarVisible(false);
      }, 4000);
    },
    [clearSnackbarTimer],
  );

  useEffect(() => {
    return () => {
      clearSnackbarTimer();
    };
  }, [clearSnackbarTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedName || !sanitizedEmail || !sanitizedPassword) {
      showNotification("Semua field harus diisi", "error");
      return;
    }

    if (sanitizedPassword.length < 8) {
      showNotification("Sandi minimal 8 karakter", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: sanitizedName,
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      showNotification(
        "Pendaftaran berhasil! Mengarahkan ke dashboard...",
        "success",
      );

      setTimeout(() => {
        router.push(nextPath);
      }, 1500);
    } catch (error) {
      showNotification(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan pendaftaran",
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
            Mulai Bersama Amertask
          </h1>
          <p className="text-foreground-muted text-sm">
            Daftar untuk infrastruktur yang cemerlang.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="name"
            type="text"
            label="Nama Sesuai Pengenal"
            placeholder="e.g. John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
            leftIcon={<UserIcon className="w-5 h-5" />}
            autoComplete="name"
            className="bg-background/80 border-border focus:border-primary/50"
          />

          <Input
            id="email"
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
            id="password"
            type={showPassword ? "text" : "password"}
            label="Kata Sandi"
            placeholder="Buat kata sandi aman"
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

          <div className="pt-2">
            <Button
              type="submit"
              variant="secondary"
              isLoading={isSubmitting}
              className="w-full h-12 text-base rounded-xl font-bold shadow-lg shadow-secondary/20 transition-all duration-300 transform active:scale-[0.98]"
            >
              Konfirmasi Pendaftaran
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-foreground-muted">
          Telah punya akun?{" "}
          <a
            href={loginHref}
            className="font-semibold text-primary hover:text-primary-hover transition-colors duration-200"
          >
            Masuk sekarang
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

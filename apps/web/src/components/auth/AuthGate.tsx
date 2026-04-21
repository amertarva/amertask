"use client";

import { useEffect, Suspense } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

interface AuthGateProps {
  children: ReactNode;
  redirectTo?: string;
  loadingFallback?: ReactNode;
}

function AuthGateContent({
  children,
  redirectTo = "/auth/login",
  loadingFallback,
}: AuthGateProps) {
  const { status } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === "unauthenticated") {
      if (typeof window === "undefined") {
        router.replace(redirectTo);
        return;
      }

      if (/[?&]next=/.test(redirectTo)) {
        router.replace(redirectTo);
        return;
      }

      const query = searchParams?.toString();
      const currentPath = `${pathname}${query ? `?${query}` : ""}`;
      const separator = redirectTo.includes("?") ? "&" : "?";

      router.replace(
        `${redirectTo}${separator}next=${encodeURIComponent(currentPath)}`,
      );
    }
  }, [pathname, redirectTo, router, searchParams, status]);

  if (status === "loading") {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Memverifikasi sesi...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}

export function AuthGate(props: AuthGateProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-text-muted">Memuat...</p>
          </div>
        </div>
      }
    >
      <AuthGateContent {...props} />
    </Suspense>
  );
}

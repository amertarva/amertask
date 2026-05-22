import type { ReactNode } from "react";

export interface AuthGateProps {
  children: ReactNode;
  redirectTo?: string;
  loadingFallback?: ReactNode;
}

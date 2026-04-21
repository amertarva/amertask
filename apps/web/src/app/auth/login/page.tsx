import React, { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Masuk | Amertask",
  description: "Masuk ke akun Amertask Anda.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-sky-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

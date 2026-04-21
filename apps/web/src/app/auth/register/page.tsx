import React, { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Daftar Akun | Amertask",
  description: "Buat akun Amertask baru Anda.",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-sky-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

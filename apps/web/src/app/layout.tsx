import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/themes/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Amertask - Manajemen Tugas Profesional",
  description:
    "Kelola tugas dan proyek tim Anda dengan mudah menggunakan Amertask",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-background" suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

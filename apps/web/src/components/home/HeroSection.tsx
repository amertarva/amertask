import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import DashboardPreviewSection from "@/components/home/preview/DashboardPreviewSection";

const COMPANY_LOGOS = [
  "/company-logos/company-01.jpg",
  "/company-logos/company-02.jpg",
  "/company-logos/company-03.jpg",
];

export default function HeroSection() {
  return (
    <div className="mx-auto w-full max-w-450 px-4 sm:px-6 lg:px-8 pt-20 pb-20 md:pt-24 md:pb-28">
      <div className="grid items-center gap-6 lg:gap-8 xl:gap-10 lg:grid-cols-12">
        <div className="lg:col-span-3 xl:col-span-4 text-center lg:text-left space-y-8 animate-fade-in">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-primary/15">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Dipercaya oleh 10.000+ Tim Profesional
            </div>
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight pb-2">
              Kendalikan Setiap Sprint.
            </h1>
          </div>
          <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Platform manajemen proyek enterprise-grade yang didesain untuk tim
            profesional yang menghargai struktur, kecepatan, dan kolaborasi
            tanpa batas.
          </p>
          <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 pt-2">
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="primary"
                className="group relative w-full overflow-hidden rounded-2xl px-8 py-6 text-lg font-bold shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/50 ring-1 ring-primary/20"
                rightIcon={
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                }
              >
                <div className="absolute inset-0 translate-y-[100%] bg-gradient-to-t from-white/15 to-transparent transition-transform duration-300 group-hover:translate-y-[50%]"></div>
                <span className="relative z-10">Mulai Eksplorasi</span>
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="group w-full sm:w-auto rounded-2xl border border-border/60 bg-background/50 backdrop-blur-md px-8 py-6 text-lg font-semibold shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-muted/80 hover:border-border hover:shadow-md"
            >
              Pelajari Selengkapnya
            </Button>
          </div>

          <div className="pt-4 flex flex-col items-center lg:items-start gap-4">
            <p className="text-sm font-medium text-text-muted">
              Terintegrasi dengan perusahaan terkemuka
            </p>
            <div className="flex items-center -space-x-3">
              {COMPANY_LOGOS.map((logo, index) => (
                <div
                  key={logo}
                  role="img"
                  aria-label={`Logo perusahaan ${index + 1}`}
                  className="h-12 w-12 rounded-full border-2 border-background shadow-md bg-muted bg-cover bg-center ring-1 ring-border/40 transition-transform duration-300 hover:scale-110 hover:z-10"
                  style={{ backgroundImage: `url(${logo})` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 xl:col-span-8 w-full">
          <DashboardPreviewSection embedded />
        </div>
      </div>
    </div>
  );
}

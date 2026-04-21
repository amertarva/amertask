import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import DashboardPreviewSection from "@/components/home/DashboardPreviewSection";

const COMPANY_LOGOS = [
  "/company-logos/company-01.jpg",
  "/company-logos/company-02.jpg",
  "/company-logos/company-03.jpg",
  "/company-logos/company-04.jpg",
  "/company-logos/company-05.jpg",
];

export default function HeroSection() {
  return (
    <div className="mx-auto w-full max-w-450 px-4 sm:px-6 lg:px-8 pt-20 pb-20 md:pt-24 md:pb-28">
      <div className="grid items-center gap-6 lg:gap-8 xl:gap-10 lg:grid-cols-12">
        <div className="lg:col-span-3 xl:col-span-4 text-center lg:text-left space-y-8 animate-fade-in">
          <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight pb-2">
            Kendalikan Setiap Sprint.
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed mt-6">
            Platform manajemen proyek yang didesain untuk tim profesional yang
            menghargai struktur dan kecepatan.
          </p>
          <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 pt-6">
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="primary"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="w-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5 rounded-xl font-bold px-8 py-6 text-lg"
              >
                Mulai Eksplorasi
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto backdrop-blur-sm border-border hover:bg-muted transition-all rounded-xl font-semibold px-8 py-6 text-lg"
            >
              Pelajari Selengkapnya
            </Button>
          </div>

          <div className="pt-3 flex justify-center lg:justify-start">
            <div className="flex items-center -space-x-3">
              {COMPANY_LOGOS.map((logo, index) => (
                <div
                  key={logo}
                  role="img"
                  aria-label={`Logo perusahaan ${index + 1}`}
                  className="h-14 w-14 rounded-full border-2 border-background shadow-md bg-muted bg-cover bg-center ring-1 ring-border/40"
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

import { type Dispatch, type SetStateAction } from "react";
import { ChevronDown } from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
import { type FormState } from "./types";

type ProjectInfoSectionProps = {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
};

export function ProjectInfoSection({ form, setForm }: ProjectInfoSectionProps) {
  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <h2 className="text-2xl font-extrabold text-text mb-2 relative z-10">
        Informasi Dasar Proyek
      </h2>
      <p className="text-sm font-medium text-text-muted relative z-10">
        Kelola metadata utama proyek yang digunakan di seluruh dashboard.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 relative z-10">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-bold text-text ml-1">Nama Proyek</span>
          <input
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-text ml-1">Slug</span>
          <input
            value={form.slug}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, slug: e.target.value }))
            }
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-bold text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
          />
        </label>

        <div className="space-y-2 relative z-50">
          <span className="text-sm font-bold text-text ml-1">Jenis Proyek</span>
          <Dropdown
            align="left"
            className="w-full"
            reserveSpaceWhenOpen
            trigger={
              <button
                type="button"
                className="flex w-full items-center justify-between bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer bg-card/50 hover:bg-muted/30"
              >
                {form.type === "konstruksi"
                  ? "Konstruksi"
                  : form.type === "it"
                    ? "IT / Software"
                    : "Tugas Umum"}
                <ChevronDown className="w-4 h-4 ml-2 text-text-muted" />
              </button>
            }
            items={[
              {
                label: "Konstruksi",
                onClick: () =>
                  setForm((prev) => ({ ...prev, type: "konstruksi" })),
              },
              {
                label: "IT / Software",
                onClick: () => setForm((prev) => ({ ...prev, type: "it" })),
              },
              {
                label: "Tugas Umum",
                onClick: () => setForm((prev) => ({ ...prev, type: "tugas" })),
              },
            ]}
          />
        </div>

        <label className="space-y-2">
          <span className="text-sm font-bold text-text ml-1">
            Tanggal Mulai
          </span>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-text ml-1">
            Tanggal Selesai
          </span>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-text ml-1">Perusahaan</span>
          <input
            value={form.company}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, company: e.target.value }))
            }
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-text ml-1">Work Area</span>
          <input
            value={form.workArea}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, workArea: e.target.value }))
            }
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-bold text-text ml-1">Deskripsi</span>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            rows={4}
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50 resize-none"
          />
        </label>
      </div>
    </div>
  );
}

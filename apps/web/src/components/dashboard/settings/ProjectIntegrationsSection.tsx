import { type Dispatch, type SetStateAction } from "react";
import { Link as LinkIcon } from "lucide-react";
import { type FormState } from "./types";

type ProjectIntegrationsSectionProps = {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
};

export function ProjectIntegrationsSection({
  form,
  setForm,
}: ProjectIntegrationsSectionProps) {
  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
      <h2 className="text-2xl font-extrabold text-text mb-2">Integrasi</h2>
      <p className="text-sm font-medium text-text-muted">
        Hubungkan proyek dengan layanan eksternal untuk dokumentasi dan
        kolaborasi kode.
      </p>

      <div className="grid grid-cols-1 gap-6 mt-8">
        <label className="space-y-2">
          <span className="text-sm font-bold text-text ml-1 flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> GitHub Repository
          </span>
          <input
            type="url"
            value={form.githubRepo}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                githubRepo: e.target.value,
              }))
            }
            placeholder="https://github.com/org/repo"
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-text ml-1 flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> Google Docs URL
          </span>
          <input
            type="url"
            value={form.googleDocsUrl}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                googleDocsUrl: e.target.value,
              }))
            }
            placeholder="https://docs.google.com/document/d/..."
            className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 text-sm font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-card/50"
          />
        </label>
      </div>
    </div>
  );
}

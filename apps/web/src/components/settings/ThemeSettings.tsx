import { useThemeStore } from "@/store/useThemeStore";
import { ColorThemePicker } from "./ColorThemePicker";
import { VisualThemePicker } from "./VisualThemePicker";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function ThemeSettings() {
  const { colorTheme, visualTheme, setColorTheme, setVisualTheme } =
    useThemeStore();
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border/50 relative">
          <h2 className="text-2xl font-extrabold text-text relative z-10">
            Warna Tema
          </h2>
          <p className="text-text-muted text-sm font-medium mt-2 max-w-lg relative z-10">
            Pilih skema warna dasar Theming System Amertask yang menyesuaikan
            dengan kondisi pencahayaan dan kenyamanan visual Anda.
          </p>
        </div>
        <div className="p-8 bg-muted/5">
          <ColorThemePicker current={colorTheme} onChange={setColorTheme} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border/50 relative">
          <h2 className="text-2xl font-extrabold text-text relative z-10">
            Tema Visual (Ornamen)
          </h2>
          <p className="text-text-muted text-sm font-medium mt-2 max-w-lg relative z-10">
            Pilih kustomisasi ornamen dekoratif untuk memberikan sentuhan dan
            nuansa spesifik pada seluruh antarmuka sistem.{" "}
          </p>
        </div>
        <div className="p-8 bg-muted/5">
          <VisualThemePicker current={visualTheme} onChange={setVisualTheme} />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-primary/30"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-5 h-5" /> Tersimpan
            </>
          ) : (
            "Simpan Preferensi Tema"
          )}
        </button>
      </div>
    </div>
  );
}

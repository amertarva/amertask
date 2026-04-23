import { Folder, Link as LinkIcon, Loader2, Trash2, Users } from "lucide-react";
import { type ProjectSettingsTab } from "./types";
import { ProjectSettingsTabButton } from "./ProjectSettingsTabButton";

type ProjectSettingsSidebarProps = {
  activeTab: ProjectSettingsTab;
  onTabChange: (tab: ProjectSettingsTab) => void;
  isDeleting: boolean;
  onDeleteProject: () => void;
};

export function ProjectSettingsSidebar({
  activeTab,
  onTabChange,
  isDeleting,
  onDeleteProject,
}: ProjectSettingsSidebarProps) {
  return (
    <div className="w-full lg:w-80 shrink-0 space-y-4">
      <div className="flex flex-row lg:flex-col gap-2 sm:gap-3 space-y-0 lg:space-y-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="snap-start shrink-0">
          <ProjectSettingsTabButton
            icon={<Folder className="w-5 h-5" />}
            label="Informasi Proyek"
            description="Identitas dan timeline"
            active={activeTab === "project"}
            onClick={() => onTabChange("project")}
          />
        </div>
        <div className="snap-start shrink-0">
          <ProjectSettingsTabButton
            icon={<LinkIcon className="w-5 h-5" />}
            label="Integrasi"
            description="Koneksi layanan eksternal"
            active={activeTab === "integrations"}
            onClick={() => onTabChange("integrations")}
          />
        </div>
        <div className="snap-start shrink-0">
          <ProjectSettingsTabButton
            icon={<Users className="w-5 h-5" />}
            label="Akses Tim"
            description="Role dan permission"
            active={activeTab === "access"}
            onClick={() => onTabChange("access")}
          />
        </div>
      </div>

      <button
        onClick={onDeleteProject}
        disabled={isDeleting}
        className="hidden lg:flex w-full items-center gap-4 px-5 py-4 rounded-[20px] transition-all text-left overflow-hidden relative bg-[hsl(var(--priority-urgent))] border border-[hsl(var(--priority-urgent))] shadow-sm hover:opacity-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="p-3 rounded-2xl transition-all shrink-0 bg-white/15 border border-white/20 text-white shadow-lg shadow-black/10">
          {isDeleting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </div>

        <div>
          <h4 className="font-extrabold text-[16px] text-white">
            Hapus Proyek
          </h4>
          <p className="text-xs font-semibold mt-1 text-white/85">
            {isDeleting
              ? "Sedang menghapus proyek..."
              : "Hapus permanen proyek, issue, dan anggota tim"}
          </p>
        </div>
      </button>
    </div>
  );
}

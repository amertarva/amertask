import { type Dispatch, type SetStateAction, type ReactNode } from "react";

export type FormState = {
  name: string;
  slug: string;
  type: "konstruksi" | "it" | "tugas";
  startDate: string;
  endDate: string;
  company: string;
  workArea: string;
  description: string;
  githubRepo: string;
  googleDocsUrl: string;
};

export type ProjectSettingsTab = "project" | "integrations" | "access";

export const INITIAL_FORM: FormState = {
  name: "",
  slug: "",
  type: "it",
  startDate: "",
  endDate: "",
  company: "",
  workArea: "",
  description: "",
  githubRepo: "",
  googleDocsUrl: "",
};

export type ProjectSettingsTabButtonProps = {
  icon: ReactNode;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
};

export type ProjectSettingsSidebarProps = {
  activeTab: ProjectSettingsTab;
  onTabChange: (tab: ProjectSettingsTab) => void;
  isDeleting: boolean;
  onDeleteProject: () => void;
};

export type ProjectSettingsSaveButtonProps = {
  isSaving: boolean;
  onSave: () => void;
};

export type ProjectSettingsAlertsProps = {
  error: string | null | undefined;
  saveError: string | null;
  saveSuccess: boolean;
  errorTitle: string;
};

export type ProjectIntegrationsSectionProps = {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
};

export type ProjectInfoSectionProps = {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
};

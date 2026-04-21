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

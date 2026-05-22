import type { Requirement } from "@/lib/core/requirements.api";
import type { SrsSectionKey } from "@/lib/core/srs.api";

export interface SrsHeaderProps {
  teamSlug: string;
  onSave: () => void;
  onCopyToDocs: () => void;
}

export interface SrsMetadataProps {
  version: string;
  onVersionChange: (v: string) => void;
  frCount: number;
  nfrCount: number;
}

export interface SrsRequirementsPreviewProps {
  number: string;
  title: string;
  icon: "settings" | "shield";
  requirements: Requirement[];
  teamSlug: string;
  type: "FR" | "NFR";
}

export interface SrsFieldConfig {
  key: SrsSectionKey;
  label: string;
  hint: string;
  isJson?: boolean;
  rows?: number;
}

export interface SrsGlossaryItem {
  term: string;
  definition: string;
}

export interface SrsUserCharacteristicItem {
  role: string;
  description: string;
}

export type SrsJsonItem = SrsGlossaryItem | SrsUserCharacteristicItem;

export type SrsTextFieldKey = Exclude<
  SrsSectionKey,
  "glossary" | "userCharacteristics"
>;

export type SrsFieldValue = string | SrsJsonItem[] | null | undefined;

export type SrsEditData = Partial<Record<SrsTextFieldKey, string | null>> & {
  glossary?: SrsGlossaryItem[];
  userCharacteristics?: SrsUserCharacteristicItem[];
  version?: string;
};

export interface SrsSectionGroup {
  number: string;
  title: string;
  icon: string;
  fields: SrsFieldConfig[];
}

export interface SrsSectionProps {
  group: SrsSectionGroup;
  editData: SrsEditData;
  teamSlug: string;
  onChange: (key: SrsSectionKey, value: SrsFieldValue) => void;
}

export interface SrsFieldProps {
  field: SrsFieldConfig;
  value: SrsFieldValue;
  teamSlug: string;
  onChange: (key: SrsSectionKey, value: SrsFieldValue) => void;
}

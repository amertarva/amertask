import { ReactNode } from "react";

export interface SettingsTabProps {
  icon: ReactNode;
  label: string;
  description: string;
  active?: boolean;
  onClick: () => void;
}

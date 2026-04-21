import React from "react";

export interface DropdownItem {
  label?: React.ReactNode;
  value?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

import React from "react";
import type { DropdownItem } from "./DropdownItem";

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
  reserveSpaceWhenOpen?: boolean;
}

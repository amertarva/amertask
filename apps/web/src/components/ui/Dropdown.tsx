// components/ui/Dropdown.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import type { DropdownItem, DropdownProps } from "@/types";
import { useThemeStore } from "@/store/useThemeStore";

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = "left",
  className,
  reserveSpaceWhenOpen = false,
}) => {
  const { colorTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (
    colorTheme === "amerta-night" ||
    (typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"))
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isOpenUpwards, setIsOpenUpwards] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 220,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = React.useCallback(() => {
    const anchor = triggerRef.current ?? dropdownRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const width = Math.max(rect.width, 220);
    let left = rect.left;

    if (align === "right") {
      left = rect.right - width;
    }

    const maxLeft = window.innerWidth - width - 8;
    left = Math.max(8, Math.min(left, maxLeft));

    // Calculate approximate menu height
    const estimatedHeight = items.reduce((total, item) => total + (item.divider ? 7 : 42), 12) + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = rect.bottom + 8;
    let up = false;
    // If space below is not enough and there's more space above, open upwards
    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      top = rect.top - estimatedHeight - 8;
      up = true;
    }
    setIsOpenUpwards(up);

    setMenuPosition({
      top,
      left,
      width,
    });
  }, [align, items]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(menuRef.current && menuRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    updateMenuPosition();

    const handleViewportChange = () => updateMenuPosition();

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, updateMenuPosition]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.divider) return;
    if (!item.disabled && item.onClick) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "relative inline-block text-left w-full",
        isOpen ? "z-50" : "z-10",
      )}
    >
      <div
        ref={triggerRef}
        className="cursor-pointer inline-flex items-center justify-center outline-none w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </div>

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={menuRef}
                style={{
                  position: "fixed",
                  top: menuPosition.top,
                  left: menuPosition.left,
                  width: menuPosition.width,
                  zIndex: 2147483000,
                  backgroundColor: isDarkMode ? "hsl(var(--background-secondary))" : "#ffffff",
                }}
                initial={{ opacity: 0, y: isOpenUpwards ? -8 : 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: isOpenUpwards ? -8 : 8, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "min-w-55 rounded-xl shadow-xl overflow-hidden p-1.5 focus:outline-none opacity-100",
                  isDarkMode
                    ? "bg-background-secondary border border-border/70"
                    : "bg-white border border-slate-200",
                  align === "right"
                    ? isOpenUpwards
                      ? "origin-bottom-right"
                      : "origin-top-right"
                    : isOpenUpwards
                      ? "origin-bottom-left"
                      : "origin-top-left",
                  className,
                )}
                data-slot="dropdown-content"
              >
                <div className="flex flex-col">
                  {items.map((item, index) => {
                    if (item.divider) {
                      return (
                        <div
                          key={`divider-${index}`}
                          className="my-1.5 h-px bg-border"
                        />
                      );
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleItemClick(item)}
                        disabled={item.disabled}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 outline-none transform active:scale-[0.98]",
                          item.disabled
                            ? "cursor-not-allowed opacity-50"
                            : item.danger
                              ? "text-text cursor-pointer hover:text-priority-urgent hover:bg-priority-urgent/10 hover:translate-x-1"
                              : "text-text cursor-pointer hover:text-primary-foreground hover:bg-primary hover:translate-x-1",
                        )}
                      >
                        {item.icon && (
                          <span
                            className={cn(
                              "transition-colors shrink-0 flex items-center justify-center w-4 h-4",
                              item.danger
                                ? "text-priority-urgent/70 group-hover:text-priority-urgent"
                                : "text-text-muted group-hover:text-primary-foreground",
                            )}
                          >
                            {item.icon}
                          </span>
                        )}
                        <span className="flex-1 text-left line-clamp-1">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};

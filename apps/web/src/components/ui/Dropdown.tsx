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
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 220,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const reservedSpaceHeight = React.useMemo(() => {
    // Approximate menu height so following fields move down while open.
    return (
      items.reduce((total, item) => total + (item.divider ? 7 : 42), 12) + 8
    );
  }, [items]);

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

    setMenuPosition({
      top: rect.bottom + 8,
      left,
      width,
    });
  }, [align]);

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

      {reserveSpaceWhenOpen && isOpen && (
        <div
          aria-hidden="true"
          className="w-full pointer-events-none"
          style={{ height: reservedSpaceHeight }}
        />
      )}

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
                }}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={cn(
                  "min-w-55 rounded-xl shadow-2xl opacity-100 overflow-hidden p-1.5 focus:outline-none",
                  isDarkMode
                    ? "bg-background-secondary border border-border/70"
                    : "bg-white border border-slate-200",
                  align === "right" ? "origin-top-right" : "origin-top-left",
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
                          className={cn(
                            "my-1.5 h-px",
                            isDarkMode ? "bg-border/50" : "bg-slate-200",
                          )}
                        />
                      );
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleItemClick(item)}
                        disabled={item.disabled}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none",
                          item.disabled
                            ? "cursor-not-allowed opacity-40"
                            : item.danger
                              ? cn(
                                  "text-text cursor-pointer hover:text-priority-urgent",
                                  isDarkMode
                                    ? "hover:bg-priority-urgent/15"
                                    : "hover:bg-priority-urgent/10",
                                )
                              : cn(
                                  "text-text cursor-pointer hover:text-primary",
                                  isDarkMode
                                    ? "hover:bg-primary/15"
                                    : "hover:bg-primary/10",
                                ),
                        )}
                      >
                        {item.icon && (
                          <span
                            className={cn(
                              "transition-colors shrink-0 flex items-center justify-center",
                              item.danger
                                ? "text-priority-urgent group-hover:text-priority-urgent"
                                : "text-text-muted group-hover:text-primary",
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

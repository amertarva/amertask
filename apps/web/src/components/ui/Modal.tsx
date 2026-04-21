// components/ui/Modal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ModalProps } from "@/types";
import { useThemeStore } from "@/store/useThemeStore";

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className,
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "fixed inset-0 z-50 backdrop-blur-sm",
              isDarkMode ? "bg-black/70" : "bg-black/40",
            )}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "relative w-full rounded-lg shadow-2xl",
                isDarkMode
                  ? "bg-background-secondary border border-border/70"
                  : "bg-white border border-slate-200",
                sizeStyles[size],
                className,
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {title && (
                <div
                  className={cn(
                    "flex items-center justify-between border-b px-6 py-4",
                    isDarkMode ? "border-border/60" : "border-slate-200",
                  )}
                >
                  <h2 className="text-lg font-semibold text-text">{title}</h2>
                  <button
                    onClick={onClose}
                    className={cn(
                      "rounded p-1 text-text-muted transition-colors hover:text-text",
                      isDarkMode ? "hover:bg-muted" : "hover:bg-slate-100",
                    )}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="px-6 py-4">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

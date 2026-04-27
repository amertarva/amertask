"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { DatePickerProps } from "@/types";
import { useThemeStore } from "@/store/useThemeStore";

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal...",
  className = "",
  disabled = false,
  align = "left",
  reserveSpaceWhenOpen = false,
  minDate,
  maxDate,
}: DatePickerProps & {
  reserveSpaceWhenOpen?: boolean;
  minDate?: string;
  maxDate?: string;
}) {
  const { colorTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(value || new Date()),
  );
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode =
    mounted &&
    (colorTheme === "amerta-night" ||
      (typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")));

  const updateMenuPosition = React.useCallback(() => {
    const anchor = triggerRef.current ?? pickerRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = 300; // Fixed width for calendar
    let left = rect.left;

    if (align === "right") {
      left = rect.right - width;
    }

    const maxLeft = window.innerWidth - width - 8;
    left = Math.max(8, Math.min(left, maxLeft));

    setMenuPosition({
      top: rect.bottom + 8,
      left,
    });
  }, [align]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        !(menuRef.current && menuRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  // Reset to value or today when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(new Date(value || new Date()));
    }
  }, [isOpen, value]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handleDateSelect = (date: Date) => {
    // Check if date is disabled
    if (isDateDisabled(date)) {
      return;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  // Helper to check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];

    if (minDate) {
      const minDateObj = new Date(minDate);
      minDateObj.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      if (checkDate < minDateObj) {
        return true;
      }
    }

    if (maxDate) {
      const maxDateObj = new Date(maxDate);
      maxDateObj.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      if (checkDate > maxDateObj) {
        return true;
      }
    }

    return false;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    handleDateSelect(today);
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return (
    <div ref={pickerRef} className={cn("relative w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 text-left bg-transparent border border-border rounded-xl",
          "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60",
          "transition-all duration-200 ease-in-out shadow-sm",
          "flex items-center justify-between group",
          isDarkMode ? "bg-background" : "bg-white",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "hover:bg-muted/30 cursor-pointer",
          isOpen && "ring-2 ring-primary/20 border-primary shadow-sm",
        )}
      >
        <span
          className={cn(
            "block truncate text-sm font-semibold",
            selectedDate ? "text-text" : "text-text-muted",
          )}
        >
          {selectedDate ? formatDate(selectedDate) : placeholder}
        </span>
        <CalendarIcon
          className={cn(
            "w-4 h-4 transition-colors shrink-0",
            selectedDate
              ? "text-primary"
              : "text-text-muted group-hover:text-text",
          )}
        />
      </button>

      {reserveSpaceWhenOpen && isOpen && (
        <div
          aria-hidden="true"
          className="w-full pointer-events-none"
          style={{ height: 360 }}
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
                  width: 300,
                  zIndex: 2147483000,
                }}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "rounded-xl shadow-xl overflow-hidden opacity-100",
                  isDarkMode
                    ? "bg-background-secondary border border-border/70"
                    : "bg-white border border-slate-200",
                  align === "right" ? "origin-top-right" : "origin-top-left",
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
                  <button
                    type="button"
                    onClick={() => navigateMonth("prev")}
                    className="p-1.5 hover:bg-background-tertiary text-text-muted hover:text-text rounded-md transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-bold text-text text-sm tracking-wide">
                    {monthNames[currentMonth.getMonth()]}{" "}
                    {currentMonth.getFullYear()}
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigateMonth("next")}
                    className="p-1.5 hover:bg-background-tertiary text-text-muted hover:text-text rounded-md transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div
                  className={cn(
                    "p-3",
                    isDarkMode ? "bg-background-secondary" : "bg-white",
                  )}
                >
                  {/* Days Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                      (day) => (
                        <div
                          key={day}
                          className="p-1 text-center text-[10px] font-bold tracking-wider uppercase text-text-muted/80"
                        >
                          {day}
                        </div>
                      ),
                    )}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((date, index) => {
                      const isToday =
                        date?.toDateString() === new Date().toDateString();
                      const isSelected =
                        selectedDate &&
                        date &&
                        selectedDate.toDateString() === date.toDateString();
                      const isDisabled = date ? isDateDisabled(date) : false;

                      return (
                        <div
                          key={index}
                          className="aspect-square flex items-center justify-center"
                        >
                          {date && (
                            <button
                              type="button"
                              onClick={() => handleDateSelect(date)}
                              disabled={isDisabled}
                              className={cn(
                                "w-8 h-8 flex items-center justify-center text-sm rounded-full transition-all duration-200",
                                "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50",
                                isDisabled
                                  ? "text-text-muted/30 cursor-not-allowed hover:bg-transparent line-through"
                                  : isSelected
                                    ? "bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary-hover hover:shadow-lg scale-105"
                                    : "text-text font-medium",
                                isToday &&
                                  !isSelected &&
                                  !isDisabled &&
                                  "text-primary border border-primary/30 font-bold bg-primary/5",
                              )}
                            >
                              {date.getDate()}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-border bg-muted">
                  {minDate && (
                    <div className="mb-2 px-2 py-1.5 bg-muted/50 rounded-lg text-[10px] text-text-muted flex items-center gap-1.5">
                      <span className="text-text-muted/50 line-through">
                        Tanggal masa lalu
                      </span>
                      <span>tidak dapat dipilih</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={goToToday}
                    className="w-full py-2 px-4 flex items-center justify-center gap-2 bg-background-tertiary hover:bg-border text-text-subtle hover:text-text rounded-lg transition-all duration-200 text-sm font-semibold group"
                  >
                    <CalendarDays className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                    Kembali ke Hari Ini
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

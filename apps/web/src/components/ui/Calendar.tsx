"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { DatePickerProps } from "@/types";

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal...",
  className = "",
  disabled = false,
  align = "left",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    onChange(formattedDate);
    setIsOpen(false);
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
    <div ref={pickerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
 w-full px-4 py-3 text-left bg-card border border-border rounded-lg
 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
 transition-all duration-200 ease-in-out
 ${
   disabled
     ? "bg-muted cursor-not-allowed opacity-60"
     : "hover:border-border-strong cursor-pointer"
 }
 ${isOpen ? "ring-2 ring-ring border-ring" : ""}
 flex items-center justify-between
 `}
      >
        <span
          className={`block truncate ${
            selectedDate ? "text-text" : "text-text-muted"
          }`}
        >
          {selectedDate ? formatDate(selectedDate) : placeholder}
        </span>
        <Calendar className="w-5 h-5 text-text-muted" />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-80 mt-1 bg-card border border-border rounded-lg shadow-lg ${align === "right" ? "right-0" : "left-0"}`}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button
              type="button"
              onClick={() => navigateMonth("prev")}
              className="p-1 hover:bg-muted rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-text">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth("next")}
              className="p-1 hover:bg-muted rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 p-2">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-text-muted"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 p-2">
            {days.map((date, index) => (
              <button
                key={index}
                type="button"
                onClick={() => date && handleDateSelect(date)}
                disabled={!date}
                className={`
 p-2 text-sm rounded-md transition-colors hover:bg-muted disabled:hover:bg-transparent
 ${date ? "cursor-pointer" : "cursor-default"}
 ${
   selectedDate && date && selectedDate.toDateString() === date.toDateString()
     ? "bg-primary text-primary-foreground hover:bg-primary-hover"
     : "text-text"
 }
 ${
   date &&
   date.toDateString() === new Date().toDateString() &&
   !(selectedDate && selectedDate.toDateString() === date.toDateString())
     ? "bg-muted font-semibold"
     : ""
 }
 `}
              >
                {date ? date.getDate() : ""}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-border">
            <button
              type="button"
              onClick={goToToday}
              className="w-full py-2 px-4 bg-muted hover:bg-background-tertiary text-text-subtle rounded-md transition-colors text-sm font-medium"
            >
              Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

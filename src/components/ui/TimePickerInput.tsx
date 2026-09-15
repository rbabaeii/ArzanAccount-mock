"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, Check, X, ChevronUp, ChevronDown, Sparkles } from "lucide-react";

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
}

export default function TimePickerInput({
  value,
  onChange,
  placeholder = "انتخاب ساعت (مثال: ۱۴:۳۰)",
  className = "",
  disabled = false,
  required = false,
  id,
  name,
}: TimePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

  // Normalize digits (Persian/Arabic to English)
  const toEnDigits = (str: string) =>
    str.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
       .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());

  // Parse initial hour and minute from value (format: "HH:MM" or "HH:MM:SS" or Persian numbers)
  const parseTime = (val: string) => {
    if (!val) {
      const now = new Date();
      return {
        hour: now.getHours(),
        minute: now.getMinutes(),
      };
    }
    const normalized = toEnDigits(val);
    const match = normalized.match(/(\d{1,2}):(\d{1,2})/);
    if (match) {
      const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
      const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
      return { hour: isNaN(h) ? 12 : h, minute: isNaN(m) ? 0 : m };
    }
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  };

  const pad = (n: number) => n.toString().padStart(2, "0");

  const [selectedHour, setSelectedHour] = useState<number>(() => parseTime(value).hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(() => parseTime(value).minute);
  const [hourStr, setHourStr] = useState<string>(() => pad(parseTime(value).hour));
  const [minuteStr, setMinuteStr] = useState<string>(() => pad(parseTime(value).minute));

  // Sync internal state when prop value changes
  useEffect(() => {
    if (value) {
      const { hour, minute } = parseTime(value);
      setSelectedHour(hour);
      setSelectedMinute(minute);
      setHourStr(pad(hour));
      setMinuteStr(pad(minute));
    }
  }, [value]);

  // Keep strings synced when numeric hours/minutes change via steppers/presets
  const updateHour = (newHour: number) => {
    const clamped = (newHour + 24) % 24;
    setSelectedHour(clamped);
    setHourStr(pad(clamped));
  };

  const updateMinute = (newMinute: number) => {
    const clamped = (newMinute + 60) % 60;
    setSelectedMinute(clamped);
    setMinuteStr(pad(clamped));
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleConfirm = () => {
    const finalHour = isNaN(parseInt(hourStr, 10)) ? selectedHour : Math.min(23, Math.max(0, parseInt(hourStr, 10)));
    const finalMinute = isNaN(parseInt(minuteStr, 10)) ? selectedMinute : Math.min(59, Math.max(0, parseInt(minuteStr, 10)));
    const timeStr = `${pad(finalHour)}:${pad(finalMinute)}`;
    onChange(timeStr);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const setNow = () => {
    const now = new Date();
    updateHour(now.getHours());
    updateMinute(now.getMinutes());
  };

  const setPastMinutes = (mins: number) => {
    const date = new Date(Date.now() - mins * 60 * 1000);
    updateHour(date.getHours());
    updateMinute(date.getMinutes());
  };

  // Direct typing handlers for Hour
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnDigits(e.target.value).replace(/\D/g, "");
    if (raw.length > 2) return;
    setHourStr(raw);

    if (raw.length === 2) {
      const num = parseInt(raw, 10);
      if (!isNaN(num)) {
        const clamped = Math.min(23, Math.max(0, num));
        setSelectedHour(clamped);
        setHourStr(pad(clamped));
        // Auto-advance focus to minute input
        minuteInputRef.current?.focus();
        minuteInputRef.current?.select();
      }
    } else if (raw.length === 1) {
      const num = parseInt(raw, 10);
      if (num > 2) {
        // If typed digit is 3..9, hour can only be single digit (e.g. 03..09)
        const clamped = Math.min(23, num);
        setSelectedHour(clamped);
        setHourStr(pad(clamped));
        minuteInputRef.current?.focus();
        minuteInputRef.current?.select();
      } else {
        setSelectedHour(num);
      }
    }
  };

  const handleHourBlur = () => {
    const num = parseInt(hourStr, 10);
    if (isNaN(num)) {
      setHourStr(pad(selectedHour));
    } else {
      const clamped = Math.min(23, Math.max(0, num));
      setSelectedHour(clamped);
      setHourStr(pad(clamped));
    }
  };

  // Direct typing handlers for Minute
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnDigits(e.target.value).replace(/\D/g, "");
    if (raw.length > 2) return;
    setMinuteStr(raw);

    if (raw.length === 2) {
      const num = parseInt(raw, 10);
      if (!isNaN(num)) {
        const clamped = Math.min(59, Math.max(0, num));
        setSelectedMinute(clamped);
        setMinuteStr(pad(clamped));
      }
    } else if (raw.length === 1) {
      const num = parseInt(raw, 10);
      if (num > 5) {
        // If typed digit > 5 (e.g. 6..9), cannot be first digit of a 2-digit minute
        const clamped = Math.min(59, num);
        setSelectedMinute(clamped);
        setMinuteStr(pad(clamped));
      } else {
        setSelectedMinute(num);
      }
    }
  };

  const handleMinuteBlur = () => {
    const num = parseInt(minuteStr, 10);
    if (isNaN(num)) {
      setMinuteStr(pad(selectedMinute));
    } else {
      const clamped = Math.min(59, Math.max(0, num));
      setSelectedMinute(clamped);
      setMinuteStr(pad(clamped));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: "hour" | "minute") => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (type === "hour") updateHour(selectedHour + 1);
      else updateMinute(selectedMinute + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (type === "hour") updateHour(selectedHour - 1);
      else updateMinute(selectedMinute - 1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Trigger Display */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full bg-brand-surfaceDim dark:bg-slate-800 border border-brand-border dark:border-slate-700 hover:border-teal-500/70 focus-within:border-brand-primary dark:focus-within:border-teal-400 focus-within:bg-white dark:focus-within:bg-slate-900 rounded-xl py-2.5 px-3 flex items-center justify-between text-xs cursor-pointer transition-all ${
          disabled ? "opacity-50 pointer-events-none" : ""
        } ${className}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          {value ? (
            <span
              dir="ltr"
              style={{ direction: "ltr" }}
              className="font-mono font-bold text-slate-900 dark:text-white tracking-widest text-sm dir-ltr"
            >
              {value}
            </span>
          ) : (
            <span className="text-neutral-400 dark:text-slate-500 truncate select-none text-xs">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="پاک کردن"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold px-2 py-0.5 rounded-md">
            ساعت
          </span>
        </div>

        {/* Hidden native input for form compatibility */}
        <input
          type="hidden"
          id={id}
          name={name}
          value={value}
          required={required}
        />
      </div>

      {/* Minimal Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 left-0 sm:left-auto sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-500" />
              <span>انتخاب ساعت و دقیقه</span>
            </span>
            <button
              type="button"
              onClick={setNow}
              className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>هم‌اکنون</span>
            </button>
          </div>

          {/* Time Picker Controls (Editable Numeric Input + Steppers) */}
          <div className="py-4 flex items-center justify-center gap-4 dir-ltr" style={{ direction: "ltr" }}>
            {/* Hour Block */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => updateHour(selectedHour + 1)}
                className="w-14 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="افزایش ساعت"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              <div className="my-1.5 w-16 h-14 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 rounded-2xl flex flex-col items-center justify-center shadow-inner transition-all">
                <input
                  ref={hourInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={hourStr}
                  onChange={handleHourChange}
                  onBlur={handleHourBlur}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleKeyDown(e, "hour")}
                  className="font-mono text-2xl font-black text-slate-900 dark:text-white bg-transparent text-center w-full outline-none p-0 cursor-text select-all"
                />
                <span className="text-[9px] text-slate-400 font-bold -mt-0.5 select-none pointer-events-none">
                  ساعت
                </span>
              </div>

              <button
                type="button"
                onClick={() => updateHour(selectedHour - 1)}
                className="w-14 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="کاهش ساعت"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Pulsing Colon */}
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 pb-3 font-mono animate-pulse select-none">
              :
            </div>

            {/* Minute Block */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => updateMinute(selectedMinute + 1)}
                className="w-14 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="افزایش دقیقه"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              <div className="my-1.5 w-16 h-14 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 rounded-2xl flex flex-col items-center justify-center shadow-inner transition-all">
                <input
                  ref={minuteInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={minuteStr}
                  onChange={handleMinuteChange}
                  onBlur={handleMinuteBlur}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleKeyDown(e, "minute")}
                  className="font-mono text-2xl font-black text-slate-900 dark:text-white bg-transparent text-center w-full outline-none p-0 cursor-text select-all"
                />
                <span className="text-[9px] text-slate-400 font-bold -mt-0.5 select-none pointer-events-none">
                  دقیقه
                </span>
              </div>

              <button
                type="button"
                onClick={() => updateMinute(selectedMinute - 1)}
                className="w-14 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="کاهش دقیقه"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-2 pb-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1.5">میانبرهای سریع:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setPastMinutes(5)}
                className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                ۵ دقیقه پیش
              </button>
              <button
                type="button"
                onClick={() => setPastMinutes(15)}
                className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                ۱۵ دقیقه پیش
              </button>
              <button
                type="button"
                onClick={() => setPastMinutes(30)}
                className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                ۳۰ دقیقه پیش
              </button>
              <button
                type="button"
                onClick={() => setPastMinutes(60)}
                className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                ۱ ساعت پیش
              </button>
            </div>
          </div>

          {/* Action Confirm Button */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>تایید ساعت ({pad(selectedHour)}:{pad(selectedMinute)})</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

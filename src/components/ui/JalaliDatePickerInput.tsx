"use client";

import React, { useEffect, useRef } from "react";
import { Calendar, Clock } from "lucide-react";
import TimePickerInput from "./TimePickerInput";

declare global {
  interface Window {
    jalaliDatepicker?: {
      startWatch: (options?: any) => void;
      show: (input: HTMLInputElement) => void;
      hide: () => void;
      updateOptions: (options: any) => void;
    };
  }
}

interface JalaliDatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string | "today";
  maxDate?: string | "today";
  onlyTime?: boolean;
  onlyDate?: boolean;
  hasSecond?: boolean;
  mode?: "single" | "range" | "multiple";
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
}

export default function JalaliDatePickerInput(props: JalaliDatePickerInputProps) {
  // If time picker mode requested, delegate to custom minimal TimePickerInput
  if (props.onlyTime) {
    return (
      <TimePickerInput
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        className={props.className}
        disabled={props.disabled}
        required={props.required}
        id={props.id}
        name={props.name}
      />
    );
  }

  return <JalaliDatePickerInner {...props} />;
}

function JalaliDatePickerInner({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  onlyTime = false,
  onlyDate,
  hasSecond = false,
  mode = "single",
  className = "",
  disabled = false,
  required = false,
  id,
  name,
}: JalaliDatePickerInputProps) {
  const isOnlyDate = onlyDate !== undefined ? onlyDate : true;
  const defaultPlaceholder = placeholder || "۱۴۰۳/۰۱/۰۱";
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dynamically import jalalidatepicker on client side
    const initJalali = async () => {
      if (!window.jalaliDatepicker) {
        // @ts-expect-error - no types available for dist file
        await import("@majidh1/jalalidatepicker/dist/jalalidatepicker.min.js");
      }

      if (window.jalaliDatepicker) {
        window.jalaliDatepicker.startWatch({
          minDate: "attr",
          maxDate: "attr",
          hasSecond: "attr",
          mode: "attr",
          zIndex: 99999,
          persianDigits: false,
          autoHide: true,
          showTodayBtn: true,
          showEmptyBtn: true,
        });
      }
    };

    initJalali();

    const inputElem = inputRef.current;
    if (!inputElem) return;

    const handleJdpChange = (e: any) => {
      onChange(e.target.value);
    };

    inputElem.addEventListener("jdp:change", handleJdpChange);
    inputElem.addEventListener("change", handleJdpChange);

    return () => {
      inputElem.removeEventListener("jdp:change", handleJdpChange);
      inputElem.removeEventListener("change", handleJdpChange);
    };
  }, [onChange]);

  const handleIconClick = () => {
    if (inputRef.current && window.jalaliDatepicker) {
      window.jalaliDatepicker.show(inputRef.current);
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        data-jdp=""
        data-jdp-min-date={minDate}
        data-jdp-max-date={maxDate}
        data-jdp-only-date={isOnlyDate ? "true" : undefined}
        data-jdp-only-time={onlyTime ? "true" : undefined}
        data-jdp-has-second={hasSecond ? "true" : "false"}
        data-jdp-mode={mode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={defaultPlaceholder}
        disabled={disabled}
        required={required}
        dir="ltr"
        className={`w-full bg-brand-surfaceDim dark:bg-slate-800 border border-brand-border dark:border-slate-700 focus:border-brand-primary dark:focus:border-teal-400 focus:bg-white dark:focus:bg-slate-900 rounded-xl py-2.5 pr-10 pl-4 text-xs font-mono text-left outline-none transition-all text-slate-800 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 disabled:opacity-50 ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={handleIconClick}
        className="absolute right-3 text-neutral-400 dark:text-slate-500 hover:text-brand-primary dark:hover:text-teal-400 transition-colors"
      >
        {onlyTime ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
      </button>
    </div>
  );
}

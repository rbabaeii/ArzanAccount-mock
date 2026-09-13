"use client";

import React, { useRef, useEffect } from "react";
import { toEnglishDigits } from "@/lib/format";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  onComplete?: (otp: string) => void;
}

export default function OtpInput({
  value,
  onChange,
  length = 5,
  disabled = false,
  onComplete,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of digits
  const digits = useMemoDigits(value, length);

  function useMemoDigits(val: string, len: number) {
    const raw = toEnglishDigits(val || "").replace(/\D/g, "");
    const arr: string[] = [];
    for (let i = 0; i < len; i++) {
      arr.push(raw[i] || "");
    }
    return arr;
  }

  // Auto focus first empty input on mount
  useEffect(() => {
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = toEnglishDigits(e.target.value).replace(/\D/g, "");
    if (!char) {
      // Clear current digit
      const nextDigits = [...digits];
      nextDigits[index] = "";
      const nextVal = nextDigits.join("");
      onChange(nextVal);
      return;
    }

    // Take the last character typed
    const singleDigit = char.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = singleDigit;
    const nextVal = nextDigits.join("");
    onChange(nextVal);

    // Auto advance focus to next box
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (nextVal.length === length) {
      onComplete?.(nextVal);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back and clear
        inputRefs.current[index - 1]?.focus();
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        onChange(nextDigits.join(""));
      } else {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        onChange(nextDigits.join(""));
      }
    } else if (e.key === "ArrowLeft") {
      if (index < length - 1) inputRefs.current[index + 1]?.focus();
    } else if (e.key === "ArrowRight") {
      if (index > 0) inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = toEnglishDigits(e.clipboardData.getData("text")).replace(/\D/g, "").slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);
    const targetIdx = Math.min(pastedData.length, length - 1);
    inputRefs.current[targetIdx]?.focus();

    if (pastedData.length === length) {
      onComplete?.(pastedData);
    }
  };

  return (
    <div dir="ltr" className="flex items-center justify-center gap-2.5 sm:gap-3 my-3">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`w-11 h-13 sm:w-13 sm:h-15 text-center font-mono font-black text-xl sm:text-2xl rounded-2xl border-2 transition-all outline-none ${
            digit
              ? "border-teal-500 bg-teal-500/10 text-teal-900 dark:text-teal-200 shadow-sm"
              : "border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-slate-600"
          } focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 focus:bg-white dark:focus:bg-slate-900`}
        />
      ))}
    </div>
  );
}

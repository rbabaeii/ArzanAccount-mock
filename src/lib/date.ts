/**
 * Persian (Jalali) Date formatting utilities
 */

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

import { toEnglishDigits } from "./format";

export function toPersianDigits(input: string | number): string {
  // Requirement: All numbers across the website must be in English digits
  return toEnglishDigits(input);
}

export function toPersianDate(inputDate?: string | number | Date | null): string {
  if (!inputDate) return "نامشخص";

  try {
    const date = parseOrderDate(inputDate);
    if (isNaN(date.getTime())) return String(inputDate);

    const formatter = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return toEnglishDigits(formatter.format(date));
  } catch {
    return toEnglishDigits(String(inputDate));
  }
}

export function toPersianDateTime(inputDate?: string | number | Date | null): string {
  if (!inputDate) return "نامشخص";

  try {
    const date = parseOrderDate(inputDate);
    if (isNaN(date.getTime())) return String(inputDate);

    const formatter = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return toEnglishDigits(formatter.format(date));
  } catch {
    return toEnglishDigits(String(inputDate));
  }
}

/**
 * Converts Jalali (Solar Hijri) date to Gregorian Date
 * Using the standard astronomical Borkowski algorithm
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;

  for (let i = 1; i < bl; i += 1) {
    const jmItem = breaks[i];
    jump = jmItem - jp;
    if (jy < jmItem) break;
    leapJ = leapJ + Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
    jp = jmItem;
  }

  const n = jy - jp;
  leapJ = leapJ + Math.floor(n / 33) * 8 + Math.floor(((n % 33) + 3) / 4);
  if ((jump % 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = Math.floor(gy / 4) - Math.floor((Math.floor(gy / 100) + 1) * 3 / 4) - 150;
  const march = 20 + leapJ - leapG;
  const nDays = (jm <= 7) ? (jm - 1) * 31 : (jm - 7) * 30 + 186;
  const totalDays = nDays + (jd - 1);

  const gDate = new Date(gy, 2, march, 23, 59, 59, 999);
  gDate.setDate(gDate.getDate() + totalDays);
  return gDate;
}

/**
 * Safely parses any date representation found in orders (ISO string, Gregorian, Persian formatted string)
 * into a valid JavaScript Date object.
 */
export function parseOrderDate(input?: string | number | Date | null): Date {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);

  const clean = toEnglishDigits(String(input)).trim();
  if (!clean || clean === "هم‌اکنون") return new Date();

  // Try direct parse if standard ISO/Gregorian format with year > 1900
  if (clean.includes("-") || clean.includes("T")) {
    const d = new Date(clean);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
      return d;
    }
  }

  // Check if Persian Jalali date string, e.g. "1405/07/06, 11:30" or "1405/07/06" or "1405-07-06"
  const jalaliMatch = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[,\s]+(\d{1,2}):(\d{1,2}))?/);
  if (jalaliMatch) {
    const jy = parseInt(jalaliMatch[1], 10);
    const jm = parseInt(jalaliMatch[2], 10);
    const jd = parseInt(jalaliMatch[3], 10);
    const hour = jalaliMatch[4] ? parseInt(jalaliMatch[4], 10) : 12;
    const min = jalaliMatch[5] ? parseInt(jalaliMatch[5], 10) : 0;

    if (jy >= 1300 && jy <= 1500) {
      const gDate = jalaliToGregorian(jy, jm, jd);
      gDate.setHours(hour, min, 0, 0);
      return gDate;
    }
  }

  const fallback = new Date(clean);
  if (!isNaN(fallback.getTime()) && fallback.getFullYear() > 1900) {
    return fallback;
  }

  return new Date();
}

/**
 * Checks whether a coupon expiration date is past.
 * Accurately parses both Persian Jalali dates (e.g. 1403/07/15 or ۱۴۰۵/۰۷/۱۰)
 * and Gregorian ISO dates (e.g. 2026-10-15).
 */
export function isCouponExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  const clean = toEnglishDigits(String(expiresAt)).trim();
  if (!clean) return false;

  // Check for Jalali format (e.g., 1405/07/15 or 1405-07-15)
  const parts = clean.split(/[-/]/);
  if (parts.length >= 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (y >= 1300 && y <= 1500 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const gDate = jalaliToGregorian(y, m, d);
      return gDate.getTime() < Date.now();
    }
  }

  // Fallback to standard Gregorian parse
  const date = new Date(clean);
  if (!isNaN(date.getTime())) {
    if (!clean.includes(":") && !clean.includes("T")) {
      date.setHours(23, 59, 59, 999);
    }
    return date.getTime() < Date.now();
  }

  return false;
}

/**
 * Generates a coupon code based on a pattern provided by admin,
 * e.g., "ARZAN-*****" where stars are replaced with random alphanumeric chars.
 */
export function generateCouponCodeFromPattern(pattern: string): string {
  const cleanPattern = (pattern || "ARZAN-*****").trim().toUpperCase();
  // Safe readable characters (no confusing 0/O, 1/I)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "";
  let hasStars = false;

  for (const ch of cleanPattern) {
    if (ch === "*") {
      hasStars = true;
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    } else {
      result += ch;
    }
  }

  // If admin didn't include stars (e.g. just wrote "ARZAN-"), append 5 random chars
  if (!hasStars) {
    result += "-";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return result;
}

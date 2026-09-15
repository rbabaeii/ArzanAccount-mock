"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Sparkles,
  X,
} from "lucide-react";
import { api } from "@/lib/api";

interface ReceiptUploaderProps {
  value: string;
  onChange: (url: string) => void;
  isUploading?: boolean;
  setIsUploading?: (loading: boolean) => void;
  maxSizeMB?: number;
  className?: string;
}

export default function ReceiptUploader({
  value,
  onChange,
  isUploading: externalIsUploading,
  setIsUploading: externalSetIsUploading,
  maxSizeMB = 10,
  className = "",
}: ReceiptUploaderProps) {
  const [internalIsUploading, setInternalIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = externalIsUploading !== undefined ? externalIsUploading : internalIsUploading;
  const setUploading = (val: boolean) => {
    setInternalIsUploading(val);
    if (externalSetIsUploading) externalSetIsUploading(val);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Validate type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("تنها فایل‌های تصویری فیش (JPG, PNG, WEBP) مجاز هستند.");
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`حجم تصویر فیش نباید بیشتر از ${maxSizeMB} مگابایت باشد.`);
      return;
    }

    setUploading(true);
    setProgress(15);

    // Smooth progress simulation while real HTTP upload completes
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          clearInterval(interval);
          return 88;
        }
        return prev + 12;
      });
    }, 100);

    try {
      const res = await api.uploadFile(file, "receipts");
      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        if (res?.url) {
          onChange(res.url);
        }
      }, 350);
    } catch (err: any) {
      clearInterval(interval);
      setUploading(false);
      setProgress(0);
      console.error("Receipt upload error:", err);
      setErrorMessage(err?.message || "خطا در آپلود فیش روی سرور. لطفاً دوباره تلاش نمایید.");
    }
  };

  const handleRemove = () => {
    onChange("");
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`w-full space-y-2 text-xs ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />

      {/* 1. UPLOAD PROGRESS ANIMATION STATE */}
      {isUploading ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-teal-500/40 bg-gradient-to-b from-teal-500/10 via-teal-500/5 to-transparent p-5 text-center transition-all shadow-inner">
          {/* Ambient background glow pulse */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-teal-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />

          <div className="relative z-10 space-y-3">
            {/* Pulsing upload cloud with animated ripple */}
            <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
              <div className="relative w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
                <UploadCloud className="w-6 h-6 animate-bounce" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-teal-700 dark:text-teal-300 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>در حال بارگذاری و پردازش امن تصویر فیش...</span>
                <span className="font-mono font-black mr-1 text-teal-600 dark:text-teal-400">
                  {progress}٪
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                تصویر در حال فشرده‌سازی و بارگذاری مستقیم روی سرور امن است
              </p>
            </div>

            {/* Glowing animated progress bar */}
            <div className="w-full max-w-md mx-auto bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-teal-500/20 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 rounded-full transition-all duration-200 relative overflow-hidden shadow-xs"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.2s_infinite] -skew-x-12" />
              </div>
            </div>
          </div>
        </div>
      ) : value ? (
        /* 2. UPLOADED SUCCESS STATE */
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 flex items-center justify-between gap-3 shadow-xs transition-all hover:border-emerald-500/50">
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail Preview */}
            <div
              onClick={() => setPreviewOpen(true)}
              className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/30 shrink-0 cursor-pointer group/thumb shadow-sm"
              title="مشاهده بزرگ‌نمایی تصویر"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Receipt Preview"
                className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Eye className="w-4 h-4" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5]" />
                <span>تصویر فیش بانکی با موفقیت پیوست شد</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs dir-ltr text-left font-mono mt-0.5">
                {value}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>مشاهده</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
              title="حذف و بارگذاری فیش جدید"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* 3. IDLE / DRAG & DROP ZONE */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-teal-500 bg-teal-500/10 scale-[1.01] shadow-lg shadow-teal-500/10"
              : "border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-teal-50/20 dark:hover:bg-teal-950/20"
          }`}
        >
          <div className="space-y-2">
            <div className="w-11 h-11 mx-auto rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-0.5 transition-all shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>

            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                برای انتخاب تصویر فیش کلیک کنید یا فایل را اینجا بکشید
              </p>
              <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">
                فرمت‌های مجاز: JPG, PNG, WEBP (حداکثر ۱۰ مگابایت)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR PREVIEW */}
      {previewOpen && value && (
        <div
          onClick={() => setPreviewOpen(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] bg-slate-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-2"
          >
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Full Receipt"
              className="w-full h-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

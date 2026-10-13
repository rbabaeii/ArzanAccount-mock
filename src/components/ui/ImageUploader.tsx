"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Link2,
  X,
  Sparkles,
} from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  maxSizeMB?: number;
  className?: string;
  placeholderText?: string;
}

export default function ImageUploader({
  value,
  onChange,
  label = "تصویر شاخص محصول",
  folder = "products",
  maxSizeMB = 5,
  className = "",
  placeholderText = "تصویر خود را اینجا بکشید یا برای انتخاب کلیک کنید",
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value || "");

  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    setErrorMessage(null);

    // Reject SVG due to Strix Security finding (Stored XSS vulnerability)
    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      setErrorMessage("فرمت SVG به دلایل امنیتی مجاز نیست. لطفاً از JPG، PNG یا WEBP استفاده کنید.");
      return;
    }

    // Validate mime type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("تنها فایل‌های تصویری (JPG, PNG, WEBP, GIF) مجاز هستند.");
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`حجم تصویر نباید بیشتر از ${maxSizeMB} مگابایت باشد.`);
      return;
    }

    setIsUploading(true);
    setProgress(15);

    // Progress animation interval simulation for smooth UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 25;
      });
    }, 80);

    const reader = new FileReader();
    reader.onload = (event) => {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        if (event.target?.result) {
          const localUrl = event.target.result as string;
          onChange(localUrl);
          setUrlInput(localUrl);
        }
      }, 250);
    };
    reader.onerror = () => {
      clearInterval(progressInterval);
      setIsUploading(false);
      setProgress(0);
      setErrorMessage("خطا در خواندن فایل محلی.");
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleRemove = () => {
    onChange("");
    setUrlInput("");
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Mode Switcher */}
      <div className="flex items-center justify-between text-xs">
        <label className="font-semibold text-admin-text dark:text-slate-200 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-brand-primary dark:text-teal-400" />
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-slate-800 p-0.5 rounded-lg border border-neutral-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              mode === "upload"
                ? "bg-white dark:bg-slate-700 text-brand-primary dark:text-teal-300 shadow-sm font-bold"
                : "text-neutral-500 dark:text-slate-400 hover:text-neutral-800 dark:hover:text-slate-200"
            }`}
          >
            آپلود فایل
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              mode === "url"
                ? "bg-white dark:bg-slate-700 text-brand-primary dark:text-teal-300 shadow-sm font-bold"
                : "text-neutral-500 dark:text-slate-400 hover:text-neutral-800 dark:hover:text-slate-200"
            }`}
          >
            لینک مستقیم
          </button>
        </div>
      </div>

      {/* Mode: URL input */}
      {mode === "url" && (
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                placeholder="https://example.com/image.webp"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 focus:border-brand-primary dark:focus:border-teal-400 rounded-xl py-2 px-3 pl-8 outline-none font-mono text-xs text-slate-800 dark:text-slate-100 dir-ltr text-left"
              />
              <Link2 className="w-4 h-4 text-neutral-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primaryDark dark:bg-teal-600 dark:hover:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
            >
              ثبت لینک
            </button>
          </div>
        </form>
      )}

      {/* Mode: File Upload Zone */}
      {mode === "upload" && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
          />

          {!value && !isUploading && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group select-none ${
                isDragging
                  ? "border-brand-primary dark:border-teal-400 bg-brand-primary/5 dark:bg-teal-400/10 scale-[1.01]"
                  : "border-neutral-300 dark:border-slate-700 hover:border-brand-primary dark:hover:border-teal-400 bg-neutral-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-2.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isDragging
                      ? "bg-brand-primary dark:bg-teal-500 text-white animate-bounce"
                      : "bg-white dark:bg-slate-700 text-brand-primary dark:text-teal-400 shadow-sm group-hover:scale-110 group-hover:bg-teal-50 dark:group-hover:bg-slate-600"
                  }`}
                >
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-admin-text dark:text-slate-200">
                    {placeholderText}
                  </p>
                  <p className="text-[11px] text-neutral-400 dark:text-slate-400">
                    فرمت‌های مجاز: PNG, JPG, WEBP (حداکثر {maxSizeMB} مگابایت)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress Animation State */}
          {isUploading && (
            <div className="border border-brand-primary/30 dark:border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/30 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden animate-pulse">
              <div className="flex items-center justify-center gap-2 text-brand-primary dark:text-teal-400">
                <Sparkles className="w-5 h-5 animate-spin" />
                <span className="text-xs font-bold">
                  در حال بهینه‌سازی و آپلود تصویر روی سرور... ({progress}٪)
                </span>
              </div>

              {/* Progress bar with animated shimmer */}
              <div className="w-full bg-neutral-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-300 relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-[shimmer_1.5s_infinite] -skew-x-12" />
                </div>
              </div>
              <span className="text-[10px] text-neutral-400 dark:text-slate-400 block font-mono">
                {progress < 100 ? "لطفاً چند لحظه شکیبا باشید..." : "آپلود با موفقیت انجام شد!"}
              </span>
            </div>
          )}
        </>
      )}

      {/* Uploaded Image Preview & Actions */}
      {value && !isUploading && (
        <div className="relative group border border-neutral-200 dark:border-slate-700 rounded-2xl p-3 bg-white dark:bg-slate-800/80 flex items-center gap-3.5 shadow-sm transition-all hover:border-brand-primary/40 dark:hover:border-teal-500/40">
          {/* Image Thumbnail */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 dark:bg-slate-700 border border-neutral-200 dark:border-slate-600 flex-shrink-0 flex items-center justify-center relative group/img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded Preview"
              className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
              onError={(e) => {
                // If broken image, fallback
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60";
              }}
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                تصویر با موفقیت بارگذاری شد
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-slate-400 font-mono truncate dir-ltr text-left mt-0.5">
              {value}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="تغییر تصویر"
              className="p-1.5 text-neutral-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-teal-400 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              title="حذف تصویر"
              className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

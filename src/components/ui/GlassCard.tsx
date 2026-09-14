"use client";

import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "teal" | "amber" | "interactive";
  borderGlow?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  variant = "default",
  borderGlow = false,
  ...props
}: GlassCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "teal":
        return "bg-teal-500/5 dark:bg-teal-950/20 border-teal-500/20 hover:border-teal-500/40";
      case "amber":
        return "bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20 hover:border-amber-500/40";
      case "interactive":
        return "bg-white/80 dark:bg-slate-900/80 hover:bg-white/95 dark:hover:bg-slate-900/95 hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-0.5 transition-all duration-300";
      case "default":
      default:
        return "bg-white/80 dark:bg-slate-900/80 border-brand-border/80 dark:border-slate-800";
    }
  };

  return (
    <div
      className={`rounded-3xl backdrop-blur-md border p-6 shadow-card transition-all duration-300 ${getVariantStyles()} ${
        borderGlow ? "ring-1 ring-teal-500/20 shadow-lg shadow-teal-500/5" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

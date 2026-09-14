"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor?: string; // e.g. "teal", "amber", "emerald", "purple", "rose"
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = "teal",
  trend,
  onClick,
  className = "",
}: DashboardCardProps) {
  const getIconStyles = () => {
    switch (iconColor) {
      case "amber":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "emerald":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "purple":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      case "rose":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      case "teal":
      default:
        return "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-3xl p-5 sm:p-6 border border-brand-border/80 dark:border-slate-800 shadow-card hover:shadow-xl hover:border-teal-500/30 transition-all duration-300 relative overflow-hidden group ${
        onClick ? "cursor-pointer hover:scale-[1.01] active:scale-95" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            {title}
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110 ${getIconStyles()}`}
        >
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              trend.isPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{trend.value}</span>
          </span>
          {trend.label && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

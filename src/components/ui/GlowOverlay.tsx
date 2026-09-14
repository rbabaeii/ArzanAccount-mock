"use client";

import React from "react";

interface GlowOverlayProps {
  children: React.ReactNode;
  variant?: "teal" | "amber" | "emerald" | "purple" | "mixed";
  intensity?: "subtle" | "normal" | "vibrant";
  className?: string;
  glowClassName?: string;
}

export default function GlowOverlay({
  children,
  variant = "teal",
  intensity = "subtle",
  className = "",
  glowClassName = "",
}: GlowOverlayProps) {
  const getGradient = () => {
    switch (variant) {
      case "teal":
        return "from-teal-500/20 via-cyan-400/15 to-emerald-500/20";
      case "amber":
        return "from-amber-500/25 via-orange-400/15 to-yellow-500/20";
      case "emerald":
        return "from-emerald-500/25 via-teal-400/20 to-cyan-500/15";
      case "purple":
        return "from-purple-600/25 via-indigo-500/15 to-pink-500/20";
      case "mixed":
      default:
        return "from-teal-500/20 via-indigo-500/15 to-amber-500/20";
    }
  };

  const getBlur = () => {
    switch (intensity) {
      case "subtle":
        return "blur-xl opacity-40 dark:opacity-30";
      case "vibrant":
        return "blur-2xl opacity-80 dark:opacity-60";
      case "normal":
      default:
        return "blur-xl opacity-60 dark:opacity-45";
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className={`absolute -inset-1 rounded-3xl bg-gradient-to-r ${getGradient()} ${getBlur()} transition-all duration-500 group-hover:opacity-75 pointer-events-none ${glowClassName}`}
      />
      {/* Foreground Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

import React from "react";

interface AmbientGlowProps {
  variant?: "teal" | "amber" | "purple" | "mixed";
  className?: string;
}

export default function AmbientGlow({
  variant = "teal",
  className = "",
}: AmbientGlowProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute select-none overflow-hidden blur-[80px] sm:blur-[100px] opacity-40 dark:opacity-25 ${className}`}
    >
      {variant === "teal" && (
        <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 animate-float-slow" />
      )}
      {variant === "amber" && (
        <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 animate-float-delayed" />
      )}
      {variant === "purple" && (
        <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 animate-float-slow" />
      )}
      {variant === "mixed" && (
        <div className="relative w-80 h-80 sm:w-[32rem] sm:h-[32rem]">
          <div className="absolute top-0 left-0 w-60 h-60 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br from-teal-500/50 to-cyan-400/40 animate-float-slow" />
          <div className="absolute bottom-0 right-0 w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tl from-amber-500/40 to-rose-400/30 animate-float-delayed" />
        </div>
      )}
    </div>
  );
}

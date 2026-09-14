"use client";

import React from "react";
import { Check, ShoppingBag, User, CreditCard, Zap } from "lucide-react";

export interface StepItem {
  id: number;
  label: string;
  icon?: React.ReactNode;
}

const DEFAULT_STEPS: StepItem[] = [
  { id: 1, label: "سبد خرید", icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 2, label: "مشخصات سفارش", icon: <User className="w-4 h-4" /> },
  { id: 3, label: "پرداخت کارت‌به‌کارت", icon: <CreditCard className="w-4 h-4" /> },
  { id: 4, label: "تحویل لایسنس", icon: <Zap className="w-4 h-4" /> },
];

interface AnimatedStepperProps {
  currentStep: number; // 1, 2, 3, or 4
  steps?: StepItem[];
  className?: string;
}

export default function AnimatedStepper({
  currentStep,
  steps = DEFAULT_STEPS,
  className = "",
}: AnimatedStepperProps) {
  const totalSteps = steps.length;
  // Calculate progress percentage for background fill
  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100)
  );

  return (
    <div
      className={`w-full max-w-3xl mx-auto py-2 px-1 ${className}`}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`مرحله ${currentStep} از ${totalSteps}`}
    >
      <div className="relative flex items-center justify-between">
        {/* Background Connecting Line */}
        <div className="absolute top-4 sm:top-5 left-4 right-4 sm:left-6 sm:right-6 h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-0 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Nodes */}
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative z-10 select-none group"
            >
              {/* Step Circle */}
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300 ${
                  isCompleted
                    ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 scale-100 ring-4 ring-teal-500/10"
                    : isActive
                    ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/20 scale-110 animate-pulse"
                    : "bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  step.icon || <span>{step.id}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={`mt-2 text-[11px] sm:text-xs transition-colors duration-200 text-center whitespace-nowrap ${
                  isCompleted
                    ? "font-bold text-teal-700 dark:text-teal-400"
                    : isActive
                    ? "font-black text-amber-600 dark:text-amber-400 drop-shadow-2xs"
                    : "font-medium text-slate-400 dark:text-slate-500"
                }`}
              >
                <span className="sm:hidden">{step.label.split(" ")[0]}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

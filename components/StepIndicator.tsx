"use client";

interface Props {
  currentStep: number;
  totalSteps: number;
  steps: { label: string; icon: string }[];
}

export default function StepIndicator({ currentStep, totalSteps, steps }: Props) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const isDone   = i < currentStep;
        const isActive = i === currentStep;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${isDone   ? "bg-green-600 text-white"
                : isActive ? "bg-green-600 text-white ring-2 ring-green-300 ring-offset-2 ring-offset-slate-50"
                           : "bg-white text-gray-400 border-2 border-gray-200"}`}>
                {isDone ? "✓" : step.icon}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap
                ${isActive ? "text-green-600" : isDone ? "text-green-500" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div className={`h-0.5 w-10 mx-1 mb-4 rounded transition-all ${i < currentStep ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

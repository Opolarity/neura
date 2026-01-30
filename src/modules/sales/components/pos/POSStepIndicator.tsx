import { Check } from "lucide-react";
import type { POSStep } from "../../types/POS.types";
import { POS_STEP_NAMES } from "../../types/POS.types";
import { cn } from "@/shared/utils/utils";

interface POSStepIndicatorProps {
  currentStep: POSStep;
  requiresShipping: boolean;
  onStepClick: (step: POSStep) => void;
  canProceedToStep: (step: POSStep) => boolean;
}

export default function POSStepIndicator({
  currentStep,
  requiresShipping,
  onStepClick,
  canProceedToStep,
}: POSStepIndicatorProps) {
  const steps: POSStep[] = requiresShipping ? [1, 2, 3, 4, 5] : [1, 2, 3, 5];

  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step;
        const isActive = currentStep === step;
        const canClick = step <= currentStep || canProceedToStep(step);

        return (
          <div key={step} className="flex items-center">
            {/* Step circle and label */}
            <button
              onClick={() => canClick && onStepClick(step)}
              disabled={!canClick}
              className={cn(
                "flex flex-col items-center gap-2 px-4",
                canClick ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isCompleted && "bg-blue-600 text-white",
                  isActive && "bg-blue-600 text-white ring-4 ring-blue-100",
                  !isCompleted && !isActive && "bg-gray-100 text-gray-500"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isActive && "text-blue-600",
                  !isActive && "text-gray-500"
                )}
              >
                {POS_STEP_NAMES[step]}
              </span>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-20 h-0.5 -mt-6",
                  currentStep > step ? "bg-blue-600" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

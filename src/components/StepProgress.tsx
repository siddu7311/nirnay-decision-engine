import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number; // 0-based
}

export const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep }) => {
  return (
    <nav aria-label="Decision builder progress" className="w-full">
      <ol className="flex items-center w-full overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li key={index} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
                    transition-all duration-200
                    ${done ? 'bg-indigo-600 border-indigo-600 text-white' : ''}
                    ${active ? 'border-indigo-600 bg-white text-indigo-700' : ''}
                    ${!done && !active ? 'border-gray-300 bg-white text-gray-400' : ''}
                  `}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <Check className="w-4 h-4" /> : <span>{index + 1}</span>}
                </div>
                <span
                  className={`
                    mt-1.5 text-[11px] font-medium whitespace-nowrap hidden sm:block
                    ${active ? 'text-indigo-700' : done ? 'text-gray-600' : 'text-gray-400'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 mt-[-16px] sm:mt-[-20px]
                    ${done ? 'bg-indigo-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

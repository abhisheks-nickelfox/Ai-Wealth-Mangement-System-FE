// Vertical progress stepper — matches the Figma "Progress icons with text" design

import StepIcon from './StepIcon';

export interface Step {
  label: string;
  sublabel?: string;
}

interface OnboardingStepperProps {
  steps: Step[];
  currentStep: number; // 0-based
}

export default function OnboardingStepper({
  steps,
  currentStep,
}: OnboardingStepperProps) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => {
        const state =
          i < currentStep ? 'completed' : i === currentStep ? 'current' : 'upcoming';
        const isLast = i === steps.length - 1;

        return (
          <div key={i} className="flex gap-3 items-start">
            {/* Icon + connector */}
            <div className="flex flex-col items-center gap-1 self-stretch shrink-0">
              <StepIcon state={state} size={24} />
              {!isLast && (
                <div
                  className="w-px flex-1 my-1"
                  style={{
                    background:
                      i < currentStep
                        ? '#7F56D9'
                        : 'repeating-linear-gradient(to bottom, #D5D7DA 0px, #D5D7DA 4px, transparent 4px, transparent 8px)',
                    minHeight: 28,
                  }}
                />
              )}
            </div>

            {/* Labels */}
            <div className="pb-6 pt-0.5">
              <p
                className={`text-sm font-semibold leading-5 ${
                  state === 'current'
                    ? 'text-[#6941C6]'
                    : state === 'completed'
                    ? 'text-[#6941C6]'
                    : 'text-[#414651]'
                }`}
              >
                {step.label}
              </p>
              {step.sublabel && (
                <p
                  className={`text-sm font-normal leading-5 mt-0.5 ${
                    state === 'current' || state === 'completed'
                      ? 'text-[#7F56D9]'
                      : 'text-[#535862]'
                  }`}
                >
                  {step.sublabel}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Vertical progress stepper — matches the Figma "Progress icons with text" design

import StepIcon from './StepIcon';

export interface Step {
  label: string;
  sublabel?: string;
}

interface OnboardingStepperProps {
  steps: Step[];
  currentStep: number; // 0-based
  /** Called when user clicks a completed step to go back. Not fired for current/upcoming steps. */
  onStepClick?: (index: number) => void;
}

export default function OnboardingStepper({
  steps,
  currentStep,
  onStepClick,
}: OnboardingStepperProps) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => {
        const state =
          i < currentStep ? 'completed' : i === currentStep ? 'current' : 'upcoming';
        const isLast      = i === steps.length - 1;
        const isClickable = state === 'completed' && !!onStepClick;
        const isActive    = state === 'current' || state === 'completed';

        return (
          <div
            key={i}
            className="flex gap-3 items-start"
          >
            {/* Icon + connector */}
            <div className="flex flex-col items-center gap-1 self-stretch shrink-0">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(i)}
                className={isClickable ? 'cursor-pointer' : 'cursor-default'}
                tabIndex={isClickable ? 0 : -1}
                aria-label={isClickable ? `Go back to ${step.label}` : undefined}
              >
                <StepIcon state={state} size={24} />
              </button>
              {!isLast && (
                <div className="relative w-px flex-1 my-1 overflow-hidden" style={{ minHeight: 28 }}>
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'repeating-linear-gradient(to bottom, #D5D7DA 0px, #D5D7DA 4px, transparent 4px, transparent 8px)',
                    }}
                  />
                  <div
                    className={`absolute inset-0 ${i < currentStep ? 'step-line-fill' : ''}`}
                    style={{
                      background: isActive ? '#7F56D9' : 'transparent',
                      transformOrigin: 'top',
                      transform: i < currentStep ? undefined : 'scaleY(0)',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Labels */}
            <div
              className={`pb-6 pt-0.5 transition-colors duration-300 ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => isClickable && onStepClick(i)}
            >
              <p
                className={`text-sm font-semibold leading-5 ${
                  state === 'current' || state === 'completed'
                    ? 'text-[#6941C6]'
                    : 'text-[#414651]'
                } ${isClickable ? 'hover:text-[#53389E]' : ''}`}
              >
                {step.label}
              </p>
              {step.sublabel && (
                <p
                  className={`text-sm font-normal leading-5 mt-0.5 ${
                    state === 'current' || state === 'completed'
                      ? 'text-[#7F56D9]'
                      : 'text-[#535862]'
                  } transition-colors duration-300`}
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

/**
 * Wizard Component
 */
import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface WizardProps {
  currentStep: number;
  steps: Array<{ label: string; description?: string }>;
  children: ReactNode;
  className?: string;
}

export const Wizard = ({ currentStep, steps, children, className }: WizardProps) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            
            return (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {isCompleted ? '✓' : stepNumber}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={cn('text-sm font-medium', isActive ? 'text-blue-600' : 'text-gray-600')}>
                      {step.label}
                    </div>
                    {step.description && (
                      <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-1 flex-1 mx-2 transition-colors',
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
};

interface WizardStepProps {
  step: number;
  currentStep: number;
  children: ReactNode;
}

export const WizardStep = ({ step, currentStep, children }: WizardStepProps) => {
  if (step !== currentStep) return null;
  return <div>{children}</div>;
};








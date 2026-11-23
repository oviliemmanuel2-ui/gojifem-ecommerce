import React from 'react';
import { Check } from 'lucide-react';

export interface CheckoutProgressStepsProps {
  currentStep: 1 | 2 | 3;
  completedAll?: boolean;
  className?: string;
}

const STEPS: Array<{ step: 1 | 2 | 3; label: string; shortLabel: string }> = [
  { step: 1, label: 'Shopping Bag', shortLabel: 'Bag' },
  { step: 2, label: 'Delivery & Payment', shortLabel: 'Checkout' },
  { step: 3, label: 'Order Confirmation', shortLabel: 'Confirmed' },
];

/**
 * Multi-step progress indicator for Shopping Bag -> Checkout -> Verified Confirmation.
 */
export function CheckoutProgressSteps({
  currentStep,
  completedAll = false,
  className = '',
}: CheckoutProgressStepsProps) {
  return (
    <nav aria-label="Checkout progress" className={`w-full ${className}`}>
      <ol className="flex items-center justify-between gap-2 sm:gap-4 bg-white border border-rose rounded-2xl px-4 py-3 shadow-sm">
        {STEPS.map((item, idx) => {
          const isCompleted = completedAll || item.step < currentStep;
          const isActive = !completedAll && item.step === currentStep;
          return (
            <React.Fragment key={item.step}>
              <li className="flex items-center gap-2 min-w-0">
                <span
                  aria-current={isActive ? 'step' : undefined}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 transition ${
                    isCompleted
                      ? 'bg-gold text-espresso'
                      : isActive
                        ? 'bg-ruby text-white ring-4 ring-rose'
                        : 'bg-ivory border border-rose text-espresso/50'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : item.step}
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-bold truncate ${
                    isCompleted || isActive ? 'text-espresso' : 'text-espresso/45'
                  }`}
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.shortLabel}</span>
                </span>
              </li>

              {idx < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`flex-1 h-0.5 rounded-full min-w-[16px] transition-colors ${
                    completedAll || item.step < currentStep ? 'bg-gold' : 'bg-rose'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

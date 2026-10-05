import { Fragment } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@lib/utils'

export default function ProgressStepper({ currentStep, totalSteps }) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="mb-4">
      {/* Mobile */}
      <div className="sm:hidden">
        <p className="mb-2 text-sm text-gray-600">
          Step <span className="font-bold text-[#1a1a1a]">{currentStep}</span> of {totalSteps}
        </p>
        <div
          className="h-0.5 w-full overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={currentStep}
        >
          <div
            className="h-full bg-[#E31837] transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop */}
      <ol className="hidden items-center justify-center sm:flex" aria-label={`Step ${currentStep} of ${totalSteps}`}>
        {steps.map((step) => {
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep
          return (
            <Fragment key={step}>
              {step > 1 && (
                <li
                  aria-hidden="true"
                  className={cn('mx-2 h-0.5 w-10', step <= currentStep ? 'bg-[#E31837]' : 'bg-gray-300')}
                />
              )}
              <li
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  isCompleted && 'border-[#E31837] bg-[#E31837] text-white',
                  isCurrent && 'border-[#E31837] bg-white text-[#E31837]',
                  !isCompleted && !isCurrent && 'border-gray-300 bg-gray-100 text-gray-400'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </div>
  )
}

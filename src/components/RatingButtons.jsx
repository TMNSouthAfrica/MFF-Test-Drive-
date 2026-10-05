import { Check } from 'lucide-react'
import { cn } from '@lib/utils'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E31837] focus-visible:ring-offset-2'

export default function RatingButtons({ options, selected, onChange, hideSelection = false }) {
  return (
    <div>
      {/* Mobile: vertical list */}
      <div className="flex flex-col gap-2 sm:hidden">
        {options.map((option) => {
          const isSelected = selected === option.label
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.label)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border-2 px-4 py-4 text-left font-semibold text-white transition-all active:scale-[0.98]',
                option.color,
                focusRing,
                isSelected ? 'border-gray-900 opacity-100 shadow-lg' : 'border-transparent opacity-70'
              )}
            >
              <span>{option.label}</span>
              {isSelected && <Check className="h-5 w-5" />}
            </button>
          )
        })}
      </div>

      {/* Desktop: 5-column grid */}
      <div className="hidden grid-cols-5 gap-3 sm:grid">
        {options.map((option) => {
          const isSelected = selected === option.label
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.label)}
              className={cn(
                'flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-1 py-4 text-center text-[13px] font-semibold text-white transition-all active:scale-[0.98]',
                option.color,
                focusRing,
                isSelected ? 'scale-105 border-gray-900 opacity-100 shadow-lg' : 'border-transparent opacity-70 hover:opacity-90'
              )}
            >
              <span>{option.label}</span>
              {isSelected && <Check className="h-5 w-5" />}
            </button>
          )
        })}
      </div>

      {!hideSelection && selected && (
        <div className="mt-4 border-t border-gray-200 pt-3 text-sm text-gray-600">
          You selected: <span className="font-bold text-[#1a1a1a]">{selected}</span>
        </div>
      )}
    </div>
  )
}

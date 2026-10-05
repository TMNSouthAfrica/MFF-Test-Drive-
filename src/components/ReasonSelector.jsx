import { AlertCircle, CheckSquare, Square } from 'lucide-react'
import { cn } from '@lib/utils'
import { Label, Textarea } from './ui-mock'

export const AMENITIES_REASON = 'Dealership Amenities not satisfactory'
export const OTHER_REASON = 'Other'

export const FACILITY_OPTIONS = ['Parking', 'Waiting area', 'Restrooms', 'Signage', 'Cleanliness']

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E31837] focus-visible:ring-offset-2'

export default function ReasonSelector({
  options,
  selected,
  onChange,
  otherText,
  onOtherTextChange,
  facilityValue,
  onFacilityChange,
}) {
  const toggle = (reason) => {
    onChange(selected.includes(reason) ? selected.filter((r) => r !== reason) : [...selected, reason])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg bg-[#E31837]/5 p-3 text-sm text-[#1a1a1a]">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E31837]" />
        <p>
          <span className="font-semibold text-[#E31837]">Required:</span> Please select at least one reason for your
          dissatisfaction.
        </p>
      </div>

      {options.map((reason) => {
        const isChecked = selected.includes(reason)
        const Icon = isChecked ? CheckSquare : Square
        return (
          <div key={reason}>
            <button
              type="button"
              aria-pressed={isChecked}
              onClick={() => toggle(reason)}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left text-sm text-[#1a1a1a] transition-colors active:scale-[0.99]',
                focusRing,
                isChecked ? 'border-[#E31837] bg-[#E31837]/5' : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', isChecked ? 'text-[#E31837]' : 'text-gray-400')} />
              <span>{reason}</span>
            </button>

            {isChecked && reason === AMENITIES_REASON && (
              <div className="ml-4 mt-2 space-y-2">
                <Label htmlFor="facility" className="text-gray-700">
                  Which facility was unsatisfactory? (optional)
                </Label>
                <select
                  id="facility"
                  value={facilityValue}
                  onChange={(e) => onFacilityChange(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white p-3 text-sm text-[#1a1a1a] focus:border-[#E31837] focus:outline-none"
                >
                  <option value="">Select a facility...</option>
                  {FACILITY_OPTIONS.map((facility) => (
                    <option key={facility} value={facility}>
                      {facility}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isChecked && reason === OTHER_REASON && (
              <div className="ml-4 mt-2 space-y-2">
                <Label htmlFor="other-reason" className="text-gray-700">
                  Please describe your reason <span className="text-[#E31837]">*</span>
                </Label>
                <Textarea
                  id="other-reason"
                  rows={3}
                  value={otherText}
                  onChange={(e) => onOtherTextChange(e.target.value)}
                  placeholder="Please provide more detail..."
                />
              </div>
            )}
          </div>
        )
      })}

      <p className="text-sm text-gray-500">
        {selected.length} reason{selected.length === 1 ? '' : 's'} selected
      </p>
    </div>
  )
}

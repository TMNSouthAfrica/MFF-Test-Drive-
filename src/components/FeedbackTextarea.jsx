import { cn } from '@lib/utils'
import { Checkbox, Label, Textarea } from './ui-mock'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E31837] focus-visible:ring-offset-2'

export default function FeedbackTextarea({
  value,
  onChange,
  consent,
  onConsentChange,
  wantsToComment,
  onWantsToCommentChange,
}) {
  const choiceClass = (isSelected) =>
    cn(
      'h-12 flex-1 rounded-lg border-2 font-semibold transition-colors',
      focusRing,
      isSelected
        ? 'border-[#E31837] bg-[#E31837] text-white'
        : 'border-gray-200 bg-white text-[#1a1a1a] hover:border-[#E31837] hover:text-[#E31837]'
    )

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm font-medium text-[#1a1a1a]">
          Would you like to leave a comment?
          {wantsToComment === true && <span className="ml-1 text-[#E31837]">(mandatory)</span>}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            aria-pressed={wantsToComment === true}
            onClick={() => onWantsToCommentChange(true)}
            className={choiceClass(wantsToComment === true)}
          >
            Yes
          </button>
          <button
            type="button"
            aria-pressed={wantsToComment === false}
            onClick={() => {
              onWantsToCommentChange(false)
              onChange('')
            }}
            className={choiceClass(wantsToComment === false)}
          >
            No
          </button>
        </div>
      </div>

      {wantsToComment === true && (
        <div className="space-y-2">
          <Label htmlFor="additional-feedback" className="text-[#1a1a1a]">
            Your comment <span className="text-[#E31837]">*</span>
          </Label>
          <Textarea
            id="additional-feedback"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Share your thoughts with us..."
            className="min-h-[120px] sm:min-h-[140px]"
          />
          {!value.trim() && (
            <p className="text-sm text-[#E31837]">This field is mandatory. Please enter your comment to continue.</p>
          )}
        </div>
      )}

      {wantsToComment !== null && (
        <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <Checkbox id="feedback-consent" checked={consent} onCheckedChange={onConsentChange} className="mt-0.5" />
          <Label htmlFor="feedback-consent" className="cursor-pointer text-sm font-normal leading-relaxed text-gray-700">
            <span className="font-semibold text-[#E31837]">Required:</span> I consent to Mahindra South Africa processing
            my feedback in accordance with POPIA. I understand this may include follow-up contact if I have indicated
            dissatisfaction, and my responses may be used to improve products and services.
          </Label>
        </div>
      )}
    </div>
  )
}

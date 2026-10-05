import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, FileText, Shield } from 'lucide-react'
import { cn } from '@lib/utils'
import { sanitizeInput } from '@/utils/helpers'
import { Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Label, Textarea } from '@components/ui-mock'
import ProgressStepper from '@components/ProgressStepper'
import RatingButtons from '@components/RatingButtons'
import ReasonSelector, { AMENITIES_REASON, OTHER_REASON } from '@components/ReasonSelector'
import FeedbackTextarea from '@components/FeedbackTextarea'
import SpinWheel from '@components/SpinWheel'

const RATING_OPTIONS = [
  { label: 'Excellent', color: 'bg-[#00c875]' },
  { label: 'Good', color: 'bg-[#9cd326]' },
  { label: 'Fair', color: 'bg-[#fdab3d]' },
  { label: 'Poor', color: 'bg-[#ff7b5c]' },
  { label: 'Unacceptable', color: 'bg-[#e2445c]' },
]

const VEHICLE_MODELS = ['3XO', 'XUV700', 'Scorpio N', 'PIK UP Single Cab', 'PIK UP Double Cab']

const DISSATISFACTION_REASONS = [
  'Route was not suitable for the vehicle',
  'Sales Consultant was not knowledgeable about the vehicle',
  'Insufficient time given for the test drive',
  'Vehicle was not clean or well-presented',
  'The Sales Executive / Consultant did not explain vehicle features before the drive',
  'The Sales Executive / Consultant was not present during the test drive',
  'Vehicle had a technical issue during the test drive',
  AMENITIES_REASON,
  OTHER_REASON,
]

const LOGO_SRC = '/mahindra-logo.png'

const isLowVehicleRating = (value) => value === 'Poor' || value === 'Unacceptable'

const formatDateTime = (date) =>
  date.toLocaleString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

function readUrlParams() {
  const params = new URLSearchParams(window.location.search)
  const expires = params.get('expires')
  let isExpired = false
  if (expires) {
    const expiryDate = new Date(expires)
    if (!Number.isNaN(expiryDate.getTime())) {
      // Treat the expiry as the end of that day in local time
      const [y, m, d] = expires.split('-').map(Number)
      const endOfDay = y && m && d ? new Date(y, m - 1, d, 23, 59, 59, 999) : expiryDate
      isExpired = new Date() > endOfDay
    }
  }
  return {
    surveyId: params.get('id'),
    dealerName: params.get('dealer'),
    isExpired,
  }
}

// Falls back to a text wordmark until the real logo file is added to /public
function Logo({ src = LOGO_SRC, className, fallbackClassName }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <span className={cn('font-extrabold lowercase tracking-wide', fallbackClassName)}>mahindra</span>
  }
  return <img src={src} alt="Mahindra" className={className} onError={() => setFailed(true)} />
}

function Header() {
  return (
    <header className="w-full bg-gradient-to-r from-[#E31837] to-[#b81226] py-3 sm:py-4">
      <div className="mx-auto flex max-w-2xl justify-center px-4 sm:justify-start">
        <Logo className="h-10 sm:h-12" fallbackClassName="text-xl text-white sm:text-2xl" />
      </div>
    </header>
  )
}

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-[#E31837]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [popiaConsent, setPopiaConsent] = useState(false)

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [submittedAt, setSubmittedAt] = useState(null)
  const [validationError, setValidationError] = useState('')

  const [vehicleModel, setVehicleModel] = useState('')
  const [overallExperience, setOverallExperience] = useState(null)
  const [dissatisfactionReason, setDissatisfactionReason] = useState([])
  const [otherReasonText, setOtherReasonText] = useState('')
  const [facilityValue, setFacilityValue] = useState('')

  const [vehiclePerformance, setVehiclePerformance] = useState(null)
  const [vehicleComfort, setVehicleComfort] = useState(null)
  const [vehicleFeatures, setVehicleFeatures] = useState(null)
  const [vehiclePerformanceFeedback, setVehiclePerformanceFeedback] = useState('')
  const [vehicleComfortFeedback, setVehicleComfortFeedback] = useState('')
  const [vehicleFeaturesFeedback, setVehicleFeaturesFeedback] = useState('')

  const [wantsToComment, setWantsToComment] = useState(null)
  const [additionalFeedback, setAdditionalFeedback] = useState('')
  const [feedbackConsent, setFeedbackConsent] = useState(false)

  const [currentTime, setCurrentTime] = useState(() => new Date())

  const { surveyId, dealerName, isExpired } = useMemo(readUrlParams, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Clear any validation message as soon as the user changes an answer
  useEffect(() => {
    setValidationError('')
  }, [
    vehicleModel,
    overallExperience,
    dissatisfactionReason,
    otherReasonText,
    vehiclePerformance,
    vehicleComfort,
    vehicleFeatures,
    wantsToComment,
    additionalFeedback,
    feedbackConsent,
  ])

  const needsReasonStep = isLowVehicleRating(overallExperience)
  const steps = needsReasonStep
    ? ['model', 'overall', 'reasons', 'vehicle', 'feedback']
    : ['model', 'overall', 'vehicle', 'feedback']
  const totalSteps = steps.length
  const stepKey = steps[currentStep - 1]
  const isLastStep = currentStep === totalSteps

  const atDealer = dealerName ? ` at ${dealerName}` : ''

  const hasLowRating = () =>
    isLowVehicleRating(overallExperience) ||
    isLowVehicleRating(vehiclePerformance) ||
    isLowVehicleRating(vehicleComfort) ||
    isLowVehicleRating(vehicleFeatures)

  const vehicleAspects = [
    {
      key: 'performance',
      label: `${vehicleModel} – Overall performance`,
      value: vehiclePerformance,
      setValue: setVehiclePerformance,
      feedback: vehiclePerformanceFeedback,
      setFeedback: setVehiclePerformanceFeedback,
    },
    {
      key: 'comfort',
      label: `${vehicleModel} – Level of comfort`,
      value: vehicleComfort,
      setValue: setVehicleComfort,
      feedback: vehicleComfortFeedback,
      setFeedback: setVehicleComfortFeedback,
    },
    {
      key: 'features',
      label: `${vehicleModel} – Features`,
      value: vehicleFeatures,
      setValue: setVehicleFeatures,
      feedback: vehicleFeaturesFeedback,
      setFeedback: setVehicleFeaturesFeedback,
    },
  ]

  // Returns an error message for the current step, or '' if it is valid
  const getStepError = () => {
    switch (stepKey) {
      case 'model':
        return vehicleModel ? '' : 'Please select the vehicle you test drove'
      case 'overall':
        return overallExperience ? '' : 'Please select a rating to continue'
      case 'reasons':
        if (dissatisfactionReason.length === 0) return 'Please select at least one reason to continue'
        if (dissatisfactionReason.includes(OTHER_REASON) && !otherReasonText.trim())
          return 'Please describe your reason to continue'
        return ''
      case 'vehicle':
        return vehiclePerformance && vehicleComfort && vehicleFeatures ? '' : 'Please rate all three aspects'
      default:
        return ''
    }
  }

  const handleStart = () => {
    if (!popiaConsent) {
      setValidationError('Please accept the privacy notice to continue')
      return
    }
    setValidationError('')
    setShowWelcome(false)
  }

  const handleBack = () => {
    setValidationError('')
    if (currentStep === 1) {
      setShowWelcome(true)
    } else {
      setCurrentStep((s) => s - 1)
    }
  }

  const handleNext = () => {
    const error = getStepError()
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError('')
    setCurrentStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    if (wantsToComment === true && !additionalFeedback.trim()) {
      setValidationError('Please enter your comment before submitting')
      return
    }
    if (!feedbackConsent) {
      setValidationError('Please consent to data usage before submitting')
      return
    }

    setValidationError('')
    setIsSubmitting(true)

    const now = new Date()
    const reasons = needsReasonStep ? dissatisfactionReason : []
    const optionalText = (text) => sanitizeInput(text) || null

    const payload = {
      name: `Test Drive Survey Response - ${now.toLocaleDateString()}`,
      surveyId: surveyId || null,
      dealer: dealerName || null,
      submittedDate: now.toISOString(),
      submittedDateLocal: now.toLocaleString('en-ZA', { dateStyle: 'full', timeStyle: 'short' }),
      device: navigator.userAgent,
      responseType: 'Test Drive Feedback',
      reviewStatus: 'New',

      vehicleModel,
      overallExperience,
      dissatisfactionReasons: reasons.length > 0 ? reasons : null,
      unsatisfactoryFacility: reasons.includes(AMENITIES_REASON) && facilityValue ? facilityValue : null,
      otherReasonDetail: reasons.includes(OTHER_REASON) ? sanitizeInput(otherReasonText) : null,

      vehiclePerformance,
      vehicleComfort,
      vehicleFeatures,
      vehiclePerformanceFeedback: isLowVehicleRating(vehiclePerformance) ? optionalText(vehiclePerformanceFeedback) : null,
      vehicleComfortFeedback: isLowVehicleRating(vehicleComfort) ? optionalText(vehicleComfortFeedback) : null,
      vehicleFeaturesFeedback: isLowVehicleRating(vehicleFeatures) ? optionalText(vehicleFeaturesFeedback) : null,

      hasLowRating: hasLowRating(),
      notes: wantsToComment === true ? sanitizeInput(additionalFeedback) : '',
      popiaConsent,
      feedbackConsent,
    }

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error(`Submit failed with status ${response.status}: ${detail}`)
      }
      setSubmittedAt(now)
      setIsComplete(true)
    } catch (error) {
      console.error(error)
      setValidationError('Failed to submit survey. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------- Expired ----------
  if (isExpired) {
    return (
      <div className="safe-area-bottom min-h-screen bg-gray-100">
        <Header />
        <div className="flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <Logo className="mb-6 h-16 sm:h-20" fallbackClassName="mb-6 text-3xl text-[#E31837]" />
              <AlertCircle className="mb-4 h-16 w-16 text-[#E31837] sm:h-20 sm:w-20" />
              <h1 className="mb-2 text-2xl font-bold text-[#1a1a1a]">Survey Link Expired</h1>
              <p className="mb-4 text-gray-600">This survey link is no longer active.</p>
              <p className="text-sm text-gray-500">
                Survey links are valid for 7 days from the date they are issued. Please contact your Mahindra dealer if
                you require a new link.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ---------- Thank you ----------
  if (isComplete) {
    return (
      <div className="safe-area-bottom min-h-screen bg-gray-100">
        <Header />
        <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8 sm:py-12">
          <Card className="w-full shadow-xl">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <Logo className="mb-6 h-16 sm:h-20" fallbackClassName="mb-6 text-3xl text-[#E31837]" />
              <CheckCircle2 className="mb-4 h-16 w-16 text-[#00c875] sm:h-20 sm:w-20" />
              <h1 className="mb-2 text-2xl font-bold text-[#1a1a1a]">Thank you for your feedback!</h1>
              <p className="mb-2 text-gray-600">Your responses have been recorded securely.</p>
              <p className="mb-4 text-sm text-gray-500">Submitted: {formatDateTime(submittedAt ?? currentTime)}</p>
              <p className="text-sm text-gray-500">
                Your personal information is protected in accordance with POPIA.
                {hasLowRating() && ' A customer care representative may contact you to address your concerns.'}
              </p>
            </CardContent>
          </Card>

          <SpinWheel surveyId={surveyId} dealer={dealerName} vehicleModel={vehicleModel} />
        </div>
      </div>
    )
  }

  // ---------- Welcome ----------
  if (showWelcome) {
    return (
      <div className="safe-area-bottom min-h-screen bg-gray-100">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
          <Card className="shadow-xl">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <Logo className="mb-4 h-20 sm:h-24" fallbackClassName="mb-4 text-3xl text-[#E31837] sm:text-4xl" />
                <h1 className="text-2xl font-bold text-[#1a1a1a] sm:text-3xl">Test Drive Experience Survey</h1>
                <p className="mt-1 font-semibold text-[#E31837]">Mahindra South Africa</p>
                <p className="mt-3 text-gray-600">
                  Thank you for test driving a Mahindra. Your feedback helps us improve our vehicles and services.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-[#E31837]" />
                  <span>{formatDateTime(currentTime)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { icon: Clock, label: 'Duration', value: '2-3 minutes' },
                  { icon: FileText, label: 'Questions', value: '4–5 short questions' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 sm:flex-col sm:text-center">
                    <Icon className="h-5 w-5 shrink-0 text-[#E31837]" />
                    <div>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-sm font-semibold text-[#1a1a1a]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <section className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <h2 className="flex items-center gap-2 font-semibold text-[#1a1a1a]">
                  <Shield className="h-4 w-4 text-[#E31837]" />
                  Privacy Notice (POPIA Compliance)
                </h2>
                <p>
                  In accordance with the <strong>Protection of Personal Information Act (POPIA)</strong>, we are
                  committed to protecting your personal information and your right to privacy.
                </p>
                <div>
                  <p className="font-semibold text-[#1a1a1a]">What we collect:</p>
                  <ul className="ml-5 list-disc">
                    <li>Your satisfaction ratings and feedback responses</li>
                    <li>Date and time the survey was completed</li>
                    <li>Device and browser used to complete the survey</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[#1a1a1a]">How we use your information:</p>
                  <ul className="ml-5 list-disc">
                    <li>To improve our vehicles, products and services</li>
                    <li>To address any concerns or issues raised in your feedback</li>
                    <li>To generate anonymous statistical reports</li>
                    <li>To follow up on low satisfaction ratings</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[#1a1a1a]">Your rights:</p>
                  <ul className="ml-5 list-disc">
                    <li>You may request access to your personal information</li>
                    <li>You may request correction or deletion of your information</li>
                    <li>You may withdraw consent at any time by contacting us</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500">
                  For queries about your personal information, contact Mahindra South Africa at{' '}
                  <a href="mailto:privacy@mahindra.co.za" className="font-semibold text-[#E31837] underline">
                    privacy@mahindra.co.za
                  </a>
                </p>
              </section>

              <div className="flex items-start gap-3 rounded-lg border border-[#E31837]/20 bg-[#E31837]/5 p-4">
                <Checkbox
                  id="popia-consent"
                  checked={popiaConsent}
                  onCheckedChange={(checked) => {
                    setPopiaConsent(checked)
                    if (checked) setValidationError('')
                  }}
                  className="mt-0.5"
                />
                <Label htmlFor="popia-consent" className="cursor-pointer text-sm font-normal leading-relaxed text-gray-700">
                  <span className="font-semibold text-[#E31837]">Required:</span> I have read and understand the Privacy
                  Notice. I consent to Mahindra South Africa collecting, processing, and storing my feedback in accordance
                  with POPIA for the purposes described above.
                </Label>
              </div>

              <ErrorBanner message={validationError} />

              <Button
                onClick={handleStart}
                className="h-12 w-full bg-[#E31837] text-lg font-semibold hover:bg-[#c41530] sm:h-14"
              >
                Start Survey
              </Button>

              <p className="text-center text-xs text-gray-400">
                By proceeding, you confirm that you recently completed a Mahindra test drive.
              </p>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-gray-500">
            © {currentTime.getFullYear()} Mahindra South Africa. All rights reserved.
          </p>
        </main>
      </div>
    )
  }

  // ---------- Survey steps ----------
  const stepConfig = {
    model: {
      title: `Which vehicle did you test drive${atDealer}?`,
      description: 'Select the model you test drove from the list',
      content: (
        <div className="space-y-2">
          <Label htmlFor="vehicle-model" className="text-gray-700">
            Vehicle <span className="text-[#E31837]">*</span>
          </Label>
          <select
            id="vehicle-model"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            className="h-12 w-full rounded-lg border-2 border-gray-200 bg-white px-3 text-base text-[#1a1a1a] focus:border-[#E31837] focus:outline-none"
          >
            <option value="">Select a vehicle...</option>
            {VEHICLE_MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    overall: {
      title: `How would you rate your overall Test Drive Experience${atDealer}?`,
      description: 'Rate your overall test drive experience at the dealership',
      content: <RatingButtons options={RATING_OPTIONS} selected={overallExperience} onChange={setOverallExperience} />,
    },
    reasons: {
      title: `Please select the primary reason(s) for your dissatisfaction${atDealer}`,
      description: 'You may select more than one reason',
      content: (
        <ReasonSelector
          options={DISSATISFACTION_REASONS}
          selected={dissatisfactionReason}
          onChange={setDissatisfactionReason}
          otherText={otherReasonText}
          onOtherTextChange={setOtherReasonText}
          facilityValue={facilityValue}
          onFacilityChange={setFacilityValue}
        />
      ),
    },
    vehicle: {
      title: `Based on your test drive${atDealer}, how would you rate the following aspects of the vehicle?`,
      description: 'Please rate each aspect of the vehicle separately',
      content: (
        <div className="space-y-6">
          {vehicleAspects.map((aspect) => (
            <div key={aspect.key} className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">{aspect.label}</p>
              <RatingButtons options={RATING_OPTIONS} selected={aspect.value} onChange={aspect.setValue} hideSelection />
              {isLowVehicleRating(aspect.value) && (
                <Textarea
                  rows={2}
                  aria-label={`Comment on ${aspect.label}`}
                  value={aspect.feedback}
                  onChange={(e) => aspect.setFeedback(e.target.value)}
                  placeholder="Please elaborate on your rating..."
                />
              )}
            </div>
          ))}
        </div>
      ),
    },
    feedback: {
      title: `Would you like to share any additional feedback about your test drive${atDealer}?`,
      description: null,
      content: (
        <FeedbackTextarea
          value={additionalFeedback}
          onChange={setAdditionalFeedback}
          consent={feedbackConsent}
          onConsentChange={setFeedbackConsent}
          wantsToComment={wantsToComment}
          onWantsToCommentChange={setWantsToComment}
        />
      ),
    },
  }

  const step = stepConfig[stepKey]

  return (
    <div className="safe-area-bottom min-h-screen bg-gray-100">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-4 sm:py-8">
        <div className="mb-3 flex items-center gap-3">
          <Logo className="h-9 sm:h-10" fallbackClassName="text-lg text-[#E31837]" />
          <p className="text-xs font-medium text-gray-500 sm:text-sm">Test Drive Experience Survey</p>
        </div>
        <ProgressStepper currentStep={currentStep} totalSteps={totalSteps} />

        <Card className="shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base leading-snug text-[#1a1a1a] sm:text-lg">{step.title}</CardTitle>
            {step.description && <p className="text-sm text-gray-500">{step.description}</p>}
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            {step.content}

            <ErrorBanner message={validationError} />

            <div className="flex gap-3 border-t border-gray-200 pt-4 sm:justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="h-12 flex-1 border-[#E31837] text-[#E31837] hover:bg-[#E31837]/5 sm:h-11 sm:flex-none sm:px-6"
              >
                Back
              </Button>
              <Button
                onClick={isLastStep ? handleSubmit : handleNext}
                disabled={isSubmitting}
                className="h-12 flex-1 bg-[#E31837] hover:bg-[#c41530] sm:h-11 sm:flex-none sm:px-6"
              >
                {isLastStep ? (isSubmitting ? 'Submitting...' : 'Submit') : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-gray-500">
          Your data is protected under POPIA
        </p>
      </main>
    </div>
  )
}

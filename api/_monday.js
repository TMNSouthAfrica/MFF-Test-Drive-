// Extra fields in the shapes the "MFF Dealership Test Drives" monday board expects, so the Pabbly
// workflow's "Update Item Column Value" steps can map them straight onto columns without formatting.
// Status/dropdown values must match the board's labels exactly.

// monday date columns: YYYY-MM-DD (South African date)
function saDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
}

const list = (values) => (Array.isArray(values) ? values.filter(Boolean).join(', ') : '')

export function surveyMondayFields(s) {
  return {
    mondaySurveyStatus: 'Completed', // Survey column
    mondayGrandPrizeEligible: 'Yes', // Grand Prize Eligible column
    mondayLowRating: s.hasLowRating === true ? 'Yes' : 'No', // Low Rating column
    mondayDissatisfactionReasons: list(s.dissatisfactionReasons), // dropdown, comma-separated labels
    mondaySurveyDate: saDate(s.submittedDate), // Survey Date column
    mondayPopiaConsent: s.popiaConsent === true ? 'Yes' : 'No', // POPIA Consent (Yes/No) status column
  }
}

export function spinMondayFields({ won, spunDate }) {
  return {
    mondaySpinStatus: won ? 'Win' : 'No Win', // Spin the Wheel column
    mondaySpinDate: saDate(spunDate), // Spin Date column
  }
}

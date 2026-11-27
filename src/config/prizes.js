// Shared by the spin wheel (src/components/SpinWheel.jsx) and the draw (api/spin.js).
// Phase 1 of the MFF brief (p.4): merchandise only, win / no win, one spin per test drive.

export const PRIZE = { id: 'merch', name: 'Mahindra merchandise', label: 'Merch' }

// Wheel layout, clockwise from the top: alternating merchandise and "No luck" segments.
export const WHEEL_SEGMENTS = [
  { type: 'prize' },
  { type: 'lose', label: 'No luck' },
  { type: 'prize' },
  { type: 'lose', label: 'No luck' },
  { type: 'prize' },
  { type: 'lose', label: 'No luck' },
  { type: 'prize' },
  { type: 'lose', label: 'No luck' },
]

// Weekly merchandise allocation PER DEALERSHIP, by region (brief p.4). Weeks run Monday–Sunday (SAST).
// Keys are region names lower-cased with spaces/dashes removed; anything not listed uses DEFAULT_WEEKLY_MERCH.
export const WEEKLY_MERCH_PER_DEALER = {
  gauteng: 5,
  westerncape: 10,
  kwazulunatal: 10,
}
export const DEFAULT_WEEKLY_MERCH = 1 // "All other dealerships"

// Short forms people may use in the Region field
export const REGION_ALIASES = { gp: 'gauteng', wc: 'westerncape', kzn: 'kwazulunatal' }

export const regionKey = (value) => {
  const key = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return REGION_ALIASES[key] || key
}

export const weeklyCapFor = (region) => WEEKLY_MERCH_PER_DEALER[regionKey(region)] ?? DEFAULT_WEEKLY_MERCH

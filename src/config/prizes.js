// Shared by the spin wheel (src/components/SpinWheel.jsx) and the draw (api/spin.js).
// Edit this list to change prizes; images live in public/prizes/.
// TESTING: true shows a "Spin again" button after every result. Set to false for one spin per submission.
export const ALLOW_RESPIN = true

export const PRIZES = [
  { id: '3xo', name: '3XO', image: '/prizes/3xo.webp' },
  { id: 'xuv700', name: 'XUV700', image: '/prizes/xuv700.webp' },
  { id: 'scorpio-n', name: 'Scorpio N', image: '/prizes/scorpio-n.webp' },
]

// Wheel layout, clockwise from the top. Each prize appears once; the rest are losing segments.
export const WHEEL_SEGMENTS = [
  { type: 'prize', prizeId: '3xo' },
  { type: 'lose', label: 'Try again' },
  { type: 'lose', label: 'So close!' },
  { type: 'prize', prizeId: 'xuv700' },
  { type: 'lose', label: 'Not this time' },
  { type: 'lose', label: 'Almost!' },
  { type: 'prize', prizeId: 'scorpio-n' },
  { type: 'lose', label: 'Next time' },
  { type: 'lose', label: 'Unlucky!' },
]

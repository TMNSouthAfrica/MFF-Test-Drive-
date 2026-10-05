import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { AlertCircle, Gift, PartyPopper, RotateCw, Sparkles } from 'lucide-react'
import { cn } from '@lib/utils'
import { ALLOW_RESPIN, PRIZES, WHEEL_SEGMENTS } from '@/config/prizes'

const SPIN_MS = 5500
const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length
const PRIZE_BG = '#171717' // matches the background of the vehicle photos
const LOSE_COLORS = ['#E31837', '#ffffff']
const BULBS = 24

const prizeById = (id) => PRIZES.find((p) => p.id === id)

const polar = (r, deg) => {
  const rad = (deg * Math.PI) / 180
  return [r * Math.sin(rad), -r * Math.cos(rad)]
}

function segmentPath(index, r = 92) {
  const a0 = index * SEGMENT_ANGLE
  const a1 = a0 + SEGMENT_ANGLE
  const [x0, y0] = polar(r, a0)
  const [x1, y1] = polar(r, a1)
  return `M0 0 L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z`
}

function celebrate() {
  const colors = ['#E31837', '#FFD700', '#ffffff', '#00c875']
  confetti({ particleCount: 140, spread: 90, origin: { y: 0.55 }, colors })
  const end = Date.now() + 1800
  const frame = () => {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

function Wheel({ rotation, spinning }) {
  let loseCount = 0
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      {/* Pointer */}
      <div className="absolute left-1/2 top-[-6px] z-20 -translate-x-1/2 drop-shadow-lg">
        <svg width="38" height="46" viewBox="0 0 38 46" aria-hidden="true">
          <path d="M19 46 L3 12 A17 17 0 1 1 35 12 Z" fill="#FFD700" stroke="#b8860b" strokeWidth="2" />
          <circle cx="19" cy="16" r="6" fill="#E31837" />
        </svg>
      </div>

      <svg viewBox="-100 -100 200 200" className="h-full w-full drop-shadow-xl" role="img" aria-label="Prize wheel">
        <defs>
          <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff3b55" />
            <stop offset="100%" stopColor="#8f0f1f" />
          </linearGradient>
          {WHEEL_SEGMENTS.map((_, i) => (
            <clipPath key={i} id={`seg-${i}`}>
              <path d={segmentPath(i)} />
            </clipPath>
          ))}
        </defs>

        {/* Rim with blinking lights */}
        <circle r="99" fill="url(#rim)" />
        {Array.from({ length: BULBS }, (_, i) => {
          const [x, y] = polar(95.5, (i * 360) / BULBS)
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2.4"
              className={cn(
                'wheel-bulb',
                i % 2 ? 'wheel-bulb-b' : 'wheel-bulb-a',
                spinning && 'wheel-bulb-fast'
              )}
            />
          )
        })}

        {/* Rotating face */}
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.12, 1)` : 'none',
          }}
        >
          {WHEEL_SEGMENTS.map((segment, i) => {
            const center = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
            if (segment.type === 'prize') {
              const prize = prizeById(segment.prizeId)
              return (
                <g key={i}>
                  <path d={segmentPath(i)} fill={PRIZE_BG} stroke="#FFD700" strokeWidth="1.2" />
                  <g clipPath={`url(#seg-${i})`}>
                    <g transform={`rotate(${center})`}>
                      <image href={prize.image} x="-27" y="-79" width="54" height="36" preserveAspectRatio="xMidYMid meet" />
                      <text
                        y="-81"
                        textAnchor="middle"
                        fill="#FFD700"
                        fontSize="7.5"
                        fontWeight="800"
                        style={{ fontFamily: 'Manrope, sans-serif' }}
                      >
                        {prize.name}
                      </text>
                    </g>
                  </g>
                </g>
              )
            }
            const fill = LOSE_COLORS[loseCount++ % LOSE_COLORS.length]
            return (
              <g key={i}>
                <path d={segmentPath(i)} fill={fill} stroke="#FFD700" strokeWidth="1.2" />
                <g transform={`rotate(${center - 90})`}>
                  <text
                    x="58"
                    y="3"
                    textAnchor="middle"
                    fill={fill === '#ffffff' ? '#E31837' : '#ffffff'}
                    fontSize="8.5"
                    fontWeight="800"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {segment.label}
                  </text>
                </g>
              </g>
            )
          })}
        </g>

        {/* Hub */}
        <circle r="22" fill="#ffffff" stroke="#FFD700" strokeWidth="3" />
        <image href="/mahindra-logo.png" x="-15" y="-11" width="30" height="22" preserveAspectRatio="xMidYMid meet" />
      </svg>
    </div>
  )
}

export default function SpinWheel({ surveyId, dealer, vehicleModel }) {
  // A new submission mounts a fresh wheel; ALLOW_RESPIN adds a "Spin again" button
  const [phase, setPhase] = useState('ready') // ready | loading | spinning | win | lose | error
  const [outcome, setOutcome] = useState(null)
  const [rotation, setRotation] = useState(0)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const spin = async () => {
    if (phase !== 'ready' && phase !== 'error') return
    setPhase('loading')

    let data
    try {
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId, dealer, vehicleModel, device: navigator.userAgent }),
      })
      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error(`Spin failed with status ${response.status}: ${detail}`)
      }
      data = await response.json()
    } catch (error) {
      console.error(error)
      setPhase('error')
      return
    }

    // Land on the segment that matches the server's result
    const candidates = WHEEL_SEGMENTS.map((s, i) => ({ s, i })).filter(({ s }) =>
      data.result === 'win' ? s.type === 'prize' && s.prizeId === data.prizeId : s.type === 'lose'
    )
    const target = candidates[Math.floor(Math.random() * candidates.length)].i
    const center = target * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
    const jitter = (Math.random() - 0.5) * SEGMENT_ANGLE * 0.35 // stay well inside the segment
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const turns = reducedMotion ? 1 : 7
    // Continue from where the wheel stopped last time so respins always turn forwards
    setRotation((current) => Math.ceil(current / 360) * 360 + turns * 360 + (360 - center) + jitter)
    setPhase('spinning')

    const finished = { ...data, spunAt: new Date().toISOString() }

    timer.current = setTimeout(() => {
      setOutcome(finished)
      setPhase(data.result)
      if (data.result === 'win') celebrate()
    }, SPIN_MS + 200)
  }

  const prize = outcome?.prizeId ? prizeById(outcome.prizeId) : null
  const showWheel = phase === 'ready' || phase === 'loading' || phase === 'spinning' || phase === 'error'

  const spinAgain = () => {
    setOutcome(null)
    setPhase('ready')
  }

  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1a1a] via-[#2a0a10] to-[#E31837] p-5 text-white shadow-xl sm:p-6">
      {showWheel && (
        <>
          <div className="mb-4 text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#FFD700]">
              <Sparkles className="h-3.5 w-3.5" /> Thank-you reward
            </p>
            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">Spin to win a Mahindra!</h2>
            <p className="mt-1 text-sm text-white/80">{ALLOW_RESPIN ? 'Land on a vehicle to win it.' : 'One spin per submission. Land on a vehicle to win it.'}</p>
          </div>

          <Wheel rotation={rotation} spinning={phase === 'spinning'} />

          {phase === 'error' && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-white/10 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FFD700]" />
              <span>We couldn't spin the wheel right now. Please try again.</span>
            </div>
          )}

          <button
            type="button"
            onClick={spin}
            disabled={phase === 'loading' || phase === 'spinning'}
            className={cn(
              'mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFE55C] to-[#FFB800] text-lg font-extrabold text-[#1a1a1a] shadow-lg transition-transform',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#E31837]',
              'hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-80',
              phase === 'ready' && 'animate-pulse-slow'
            )}
          >
            <RotateCw className={cn('h-5 w-5', (phase === 'loading' || phase === 'spinning') && 'animate-spin')} />
            {phase === 'loading' || phase === 'spinning' ? 'Spinning...' : phase === 'error' ? 'Try again' : 'SPIN THE WHEEL'}
          </button>
        </>
      )}

      {phase === 'win' && prize && (
        <div className="text-center" aria-live="polite">
          <PartyPopper className="mx-auto h-12 w-12 text-[#FFD700]" />
          <h2 className="mt-2 text-3xl font-extrabold">You're a winner!</h2>
          <p className="mt-1 text-white/90">
            You've won a <span className="font-bold text-[#FFD700]">Mahindra {prize.name}</span>
          </p>
          <div className="mx-auto mt-4 overflow-hidden rounded-xl border-2 border-[#FFD700] bg-[#171717]">
            <img src={prize.image} alt={`Mahindra ${prize.name}`} className="w-full" />
          </div>
          <div className="mt-4 rounded-xl bg-white p-4 text-[#1a1a1a]">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Your claim code</p>
            <p className="mt-1 select-all font-mono text-2xl font-extrabold tracking-widest text-[#E31837]">
              {outcome.claimCode}
            </p>
            <p className="mt-2 text-xs text-gray-600">
              Keep this code safe or take a screenshot. A Mahindra South Africa representative will contact you to verify
              your win and arrange your prize.
            </p>
          </div>
          <p className="mt-3 text-[11px] text-white/60">Terms and conditions apply. Prize subject to verification.</p>
        </div>
      )}

      {phase === 'lose' && (
        <div className="py-4 text-center" aria-live="polite">
          <Gift className="mx-auto h-12 w-12 text-[#FFD700]" />
          <h2 className="mt-2 text-2xl font-extrabold">Not this time!</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-white/85">
            You didn't land on a prize today, but thank you for taking part. Your feedback helps us build even better
            vehicles.
          </p>
          {!ALLOW_RESPIN && (
            <p className="mt-4 text-xs text-white/60">Complete another test drive survey for another spin.</p>
          )}
        </div>
      )}
      {ALLOW_RESPIN && (phase === 'win' || phase === 'lose') && (
        <button
          type="button"
          onClick={spinAgain}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#FFD700] font-bold text-[#FFD700] transition-colors hover:bg-[#FFD700] hover:text-[#1a1a1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <RotateCw className="h-5 w-5" />
          Spin again
        </button>
      )}
    </div>
  )
}

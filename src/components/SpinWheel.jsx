import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { AlertCircle, RotateCw } from 'lucide-react'
import { cn } from '@lib/utils'
import { ALLOW_RESPIN, PRIZES, WHEEL_SEGMENTS } from '@/config/prizes'

const SPIN_MS = 6500
const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length
const PRIZE_BG = '#171717' // matches the background of the vehicle photos
const LOSE_COLORS = ['#0b0b0b', '#242424']
const GOLD = '#c9a35a'
const CHAMPAGNE = '#e8d5a3'

const prizeById = (id) => PRIZES.find((p) => p.id === id)

const polar = (r, deg) => {
  const rad = (deg * Math.PI) / 180
  return [r * Math.sin(rad), -r * Math.cos(rad)]
}

function segmentPath(index, r = 88) {
  const a0 = index * SEGMENT_ANGLE
  const a1 = a0 + SEGMENT_ANGLE
  const [x0, y0] = polar(r, a0)
  const [x1, y1] = polar(r, a1)
  return `M0 0 L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z`
}

// A short, restrained shower of gold
function celebrate() {
  const colors = ['#f6e7b0', '#c9a35a', '#8a6a2f', '#ffffff']
  const base = { colors, shapes: ['square'], scalar: 0.7, ticks: 260, gravity: 0.6, drift: 0 }
  confetti({ ...base, particleCount: 90, spread: 70, startVelocity: 38, origin: { y: 0.45 } })
  setTimeout(() => confetti({ ...base, particleCount: 50, spread: 110, startVelocity: 25, origin: { y: 0.35 } }), 350)
}

const VIEWBOX = '-100 -100 200 200'

function RimGradient({ id }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#f6e7b0" />
      <stop offset="30%" stopColor="#c9a35a" />
      <stop offset="55%" stopColor="#7a5a24" />
      <stop offset="80%" stopColor="#e8d08a" />
      <stop offset="100%" stopColor="#8a6a2f" />
    </linearGradient>
  )
}

// Three stacked layers: static rim, rotating face, static sheen + hub.
// The face rotates as an HTML element (not an SVG group) so the spin works reliably in Safari/iOS too.
function Wheel({ rotation, spinning }) {
  let loseCount = 0
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[320px]" role="img" aria-label="Prize wheel">
      {/* Soft gold halo behind the wheel */}
      <div className="pointer-events-none absolute inset-[-8%] rounded-full bg-[radial-gradient(circle,rgba(201,163,90,0.22)_0%,rgba(201,163,90,0)_65%)]" />

      {/* Layer 1: metallic rim */}
      <svg viewBox={VIEWBOX} className="absolute inset-0 h-full w-full drop-shadow-[0_24px_40px_rgba(0,0,0,0.7)]" aria-hidden="true">
        <defs>
          <RimGradient id="rim-gold" />
        </defs>
        <circle r="99" fill="url(#rim-gold)" />
        <circle r="93" fill="#0b0b0b" />
        <circle r="90" fill="none" stroke="url(#rim-gold)" strokeWidth="0.6" />
      </svg>

      {/* Layer 2: rotating face */}
      <div
        data-wheel-face
        className="absolute inset-0"
        style={{
          transform: `rotate(${rotation}deg)`,
          WebkitTransform: `rotate(${rotation}deg)`,
          transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 0.84, 0.18, 1)` : 'none',
          willChange: 'transform',
        }}
      >
        <svg viewBox={VIEWBOX} className="h-full w-full" aria-hidden="true">
          <defs>
            {WHEEL_SEGMENTS.map((_, i) => (
              <clipPath key={i} id={`seg-${i}`}>
                <path d={segmentPath(i)} />
              </clipPath>
            ))}
          </defs>

          {WHEEL_SEGMENTS.map((segment, i) => {
            const center = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
            if (segment.type === 'prize') {
              const prize = prizeById(segment.prizeId)
              return (
                <g key={i}>
                  <path d={segmentPath(i)} fill={PRIZE_BG} />
                  <g clipPath={`url(#seg-${i})`}>
                    <g transform={`rotate(${center})`}>
                      <image href={prize.image} x="-27" y="-76" width="54" height="36" preserveAspectRatio="xMidYMid meet" />
                      <text
                        y="-79"
                        textAnchor="middle"
                        fill={CHAMPAGNE}
                        fontSize="5.6"
                        fontWeight="600"
                        letterSpacing="1.2"
                        style={{ fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase' }}
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
                <path d={segmentPath(i)} fill={fill} />
                <g transform={`rotate(${center - 90})`}>
                  <text
                    x="57"
                    y="1.8"
                    textAnchor="middle"
                    fill="#a39a85"
                    fontSize="5"
                    fontWeight="500"
                    letterSpacing="1.4"
                    style={{ fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase' }}
                  >
                    {segment.label}
                  </text>
                </g>
              </g>
            )
          })}

          {/* Fine gold dividers and studs */}
          {WHEEL_SEGMENTS.map((_, i) => {
            const [x, y] = polar(88, i * SEGMENT_ANGLE)
            const [sx, sy] = polar(91.5, i * SEGMENT_ANGLE)
            return (
              <g key={`d-${i}`}>
                <line x1="0" y1="0" x2={x} y2={y} stroke={GOLD} strokeWidth="0.7" strokeOpacity="0.85" />
                <circle cx={sx} cy={sy} r="1.3" fill="#e8d08a" />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Layer 3: glass sheen and hub (static) */}
      <svg viewBox={VIEWBOX} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <RimGradient id="hub-gold" />
          <radialGradient id="sheen" cx="35%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </radialGradient>
        </defs>
        <circle r="88" fill="url(#sheen)" />
        <circle r="23" fill="url(#hub-gold)" />
        <circle r="20.5" fill="#0b0b0b" />
        <image href="/mahindra-logo-white.png" x="-13" y="-10" width="26" height="19" preserveAspectRatio="xMidYMid meet" />
      </svg>

      {/* Pointer */}
      <div className="absolute left-1/2 top-[-10px] z-20 -translate-x-1/2 drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
        <svg width="26" height="40" viewBox="0 0 26 40" aria-hidden="true">
          <defs>
            <linearGradient id="pointer-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f6e7b0" />
              <stop offset="50%" stopColor="#c9a35a" />
              <stop offset="100%" stopColor="#7a5a24" />
            </linearGradient>
          </defs>
          <path d="M13 40 L2 10 A11 11 0 1 1 24 10 Z" fill="url(#pointer-gold)" />
          <circle cx="13" cy="11" r="3.5" fill="#0b0b0b" />
        </svg>
      </div>
    </div>
  )
}

function Eyebrow({ children }) {
  return (
    <p className="flex items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c9a35a]">
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#c9a35a]" />
      {children}
      <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#c9a35a]" />
    </p>
  )
}

const goldText = 'bg-gradient-to-r from-[#f6e7b0] via-[#c9a35a] to-[#e8d08a] bg-clip-text text-transparent'

export default function SpinWheel({ surveyId, dealer, vehicleModel }) {
  // A new submission mounts a fresh wheel; ALLOW_RESPIN adds a "Spin again" button
  const [phase, setPhase] = useState('ready') // ready | loading | spinning | win | lose | error
  const [outcome, setOutcome] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [errorCode, setErrorCode] = useState('')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const spin = async () => {
    if (phase !== 'ready' && phase !== 'error') return
    setPhase('loading')
    setErrorCode('')

    let data
    try {
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId, dealer, vehicleModel, device: navigator.userAgent }),
      })
      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        const error = new Error(`Spin failed with status ${response.status}: ${detail}`)
        error.code = String(response.status)
        throw error
      }
      data = await response.json()
      if (!data || (data.result !== 'win' && data.result !== 'lose')) {
        const error = new Error(`Unexpected spin response: ${JSON.stringify(data)}`)
        error.code = 'bad-response'
        throw error
      }
    } catch (error) {
      console.error(error)
      setErrorCode(error.code || 'network')
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
    const turns = reducedMotion ? 1 : 6
    // Continue from where the wheel stopped last time so respins always turn forwards
    setRotation((current) => Math.ceil(current / 360) * 360 + turns * 360 + (360 - center) + jitter)
    setPhase('spinning')

    const finished = { ...data, spunAt: new Date().toISOString() }

    timer.current = setTimeout(() => {
      setOutcome(finished)
      setPhase(data.result)
      if (data.result === 'win') celebrate()
    }, SPIN_MS + 300)
  }

  const spinAgain = () => {
    setOutcome(null)
    setPhase('ready')
  }

  const prize = outcome?.prizeId ? prizeById(outcome.prizeId) : null
  const showWheel = phase === 'ready' || phase === 'loading' || phase === 'spinning' || phase === 'error'
  const busy = phase === 'loading' || phase === 'spinning'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#c9a35a]/30 bg-[#0b0b0b] px-5 py-8 text-white shadow-2xl sm:px-8 sm:py-10">
      {/* Ambient light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(201,163,90,0.18),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#E31837]/60 to-transparent" />

      <div className="relative">
        {showWheel && (
          <>
            <div className="mb-8 text-center">
              <Eyebrow>Exclusive reward</Eyebrow>
              <h2 className="mt-4 text-2xl font-light leading-snug tracking-wide sm:text-[28px]">
                A chance to drive home
                <br />
                <span className={cn('font-semibold', goldText)}>a new Mahindra</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-white/55">
                As thanks for your feedback, spin the wheel. Should it come to rest on a vehicle, it is yours.
              </p>
            </div>

            <Wheel rotation={rotation} spinning={phase === 'spinning'} />

            {phase === 'error' && (
              <div role="alert" className="mt-6 flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/80">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a35a]" />
                <span>
                  We couldn't spin the wheel just now. Please try again.
                  {errorCode && <span className="ml-1 text-white/40">(Error {errorCode})</span>}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={spin}
              disabled={busy}
              className={cn(
                'group relative mt-8 flex h-14 w-full items-center justify-center overflow-hidden rounded-full',
                'bg-gradient-to-r from-[#8a6a2f] via-[#e8d08a] to-[#8a6a2f] text-xs font-semibold uppercase tracking-[0.3em] text-[#0b0b0b]',
                'shadow-[0_10px_30px_-10px_rgba(201,163,90,0.7)] transition-all duration-300 hover:shadow-[0_14px_36px_-8px_rgba(201,163,90,0.9)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d08a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0b]',
                'disabled:pointer-events-none disabled:opacity-70'
              )}
            >
              <span className="lux-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              <span className="relative">{busy ? 'Spinning' : phase === 'error' ? 'Try again' : 'Spin the wheel'}</span>
            </button>
          </>
        )}

        {phase === 'win' && prize && (
          <div className="text-center" aria-live="polite">
            <Eyebrow>Congratulations</Eyebrow>
            <h2 className="mt-4 text-2xl font-light tracking-wide sm:text-[28px]">
              You have won the
              <br />
              <span className={cn('font-semibold', goldText)}>Mahindra {prize.name}</span>
            </h2>

            <div className="relative mx-auto mt-6 overflow-hidden rounded-xl border border-[#c9a35a]/40 bg-[#171717]">
              <img src={prize.image} alt={`Mahindra ${prize.name}`} className="w-full" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            <div className="mt-6 rounded-xl border border-[#c9a35a]/40 bg-gradient-to-b from-white/[0.04] to-transparent px-4 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50">Your claim code</p>
              <p className={cn('mt-2 select-all whitespace-nowrap text-xl font-semibold tracking-[0.12em] sm:text-2xl sm:tracking-[0.2em]', goldText)}>{outcome.claimCode}</p>
              <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-white/60">
                Please keep this code safe. A Mahindra South Africa representative will be in touch to verify your win and
                arrange the handover.
              </p>
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/35">Terms and conditions apply</p>
          </div>
        )}

        {phase === 'lose' && (
          <div className="py-6 text-center" aria-live="polite">
            <Eyebrow>Thank you</Eyebrow>
            <h2 className="mt-4 text-2xl font-light tracking-wide sm:text-[28px]">Not this time</h2>
            <p className="mx-auto mt-3 max-w-xs text-sm font-light leading-relaxed text-white/60">
              The wheel didn't land on a vehicle today. We truly appreciate you sharing your experience with us.
            </p>
            {!ALLOW_RESPIN && (
              <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-white/35">
                Complete another test drive survey for another spin
              </p>
            )}
          </div>
        )}

        {ALLOW_RESPIN && (phase === 'win' || phase === 'lose') && (
          <button
            type="button"
            onClick={spinAgain}
            className="mx-auto mt-6 flex h-11 items-center justify-center gap-2 rounded-full border border-[#c9a35a]/50 px-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#e8d5a3] transition-colors hover:border-[#c9a35a] hover:bg-[#c9a35a]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d08a]"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Spin again
          </button>
        )}
      </div>
    </div>
  )
}

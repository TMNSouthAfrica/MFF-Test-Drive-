import { randomInt } from 'node:crypto'
import { PRIZES } from '../src/config/prizes.js'
import { forwardToPabbly } from './_pabbly.js'

// Total chance (0–1) that a spin wins any vehicle. Override with the SPIN_WIN_CHANCE env var.
const DEFAULT_WIN_CHANCE = 0.5 // TESTING: 50% win / 50% lose. Lower before going live.
const CLAIM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const clean = (value, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : null) || null

function getWinChance() {
  const value = Number.parseFloat(process.env.SPIN_WIN_CHANCE)
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : DEFAULT_WIN_CHANCE
}

// SPIN_FORCE_RESULT=win | lose | <prize id> is for testing only; leave it unset in production.
function draw() {
  const forced = (process.env.SPIN_FORCE_RESULT || '').trim().toLowerCase()
  if (forced === 'lose') return null
  const forcedPrize = PRIZES.find((p) => p.id === forced)
  if (forcedPrize) return forcedPrize
  if (forced === 'win') return PRIZES[randomInt(PRIZES.length)]

  const roll = randomInt(1_000_000) / 1_000_000
  return roll < getWinChance() ? PRIZES[randomInt(PRIZES.length)] : null
}

function makeClaimCode() {
  let code = ''
  for (let i = 0; i < 8; i++) code += CLAIM_ALPHABET[randomInt(CLAIM_ALPHABET.length)]
  return `MSA-${code.slice(0, 4)}-${code.slice(4)}`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body = req.body || {}
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }

  const prize = draw()
  const spunAt = new Date()
  const result = {
    result: prize ? 'win' : 'lose',
    prizeId: prize?.id ?? null,
    prizeName: prize?.name ?? null,
    claimCode: prize ? makeClaimCode() : null,
  }

  const payload = {
    name: `Spin Result - ${prize ? `WIN ${prize.name}` : 'No win'}`,
    responseType: 'Spin Result',
    surveyId: clean(body.surveyId),
    dealer: clean(body.dealer),
    vehicleModel: clean(body.vehicleModel),
    spinResult: prize ? 'Win' : 'Lose',
    prize: result.prizeName,
    claimCode: result.claimCode,
    spunDate: spunAt.toISOString(),
    spunDateLocal: spunAt.toLocaleString('en-ZA', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Johannesburg' }),
    device: clean(body.device, 500),
  }

  try {
    // Record every spin so wins can be verified against the claim code
    const response = await forwardToPabbly(payload, process.env.PABBLY_SPIN_WEBHOOK_URL || process.env.PABBLY_WEBHOOK_URL)
    if (!response.ok) {
      return res.status(502).json({ error: 'Could not record the spin', status: response.status })
    }
  } catch (error) {
    console.error('Failed to record spin:', error)
    return res.status(500).json({ error: 'Could not record the spin', detail: String(error?.message || error) })
  }

  return res.status(200).json(result)
}

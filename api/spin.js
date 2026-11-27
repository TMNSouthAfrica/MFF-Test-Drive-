import { randomInt } from 'node:crypto'
import { PRIZE, weeklyCapFor } from '../src/config/prizes.js'
import { forwardToPabbly, mondayItemIdFrom, summarise } from './_pabbly.js'
import { spinMondayFields } from './_monday.js'
import { redis, storeConfigured } from './_store.js'

// Chance (0–1) that a spin wins, while the dealer still has merchandise left this week.
// Override with the SPIN_WIN_CHANCE env var.
const DEFAULT_WIN_CHANCE = 0.3
const CLAIM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const DAY = 24 * 60 * 60

const clean = (value, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : null) || null
const slug = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown'

function getWinChance() {
  const value = Number.parseFloat(process.env.SPIN_WIN_CHANCE)
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : DEFAULT_WIN_CHANCE
}

// Monday (SAST) of the current week, e.g. "2026-11-23". Weekly allocations reset at Monday 00:00 SAST.
function weekStart(date = new Date()) {
  const sast = new Date(date.getTime() + 2 * 60 * 60 * 1000)
  sast.setUTCDate(sast.getUTCDate() - ((sast.getUTCDay() + 6) % 7))
  return sast.toISOString().slice(0, 10)
}

function makeClaimCode() {
  let code = ''
  for (let i = 0; i < 8; i++) code += CLAIM_ALPHABET[randomInt(CLAIM_ALPHABET.length)]
  return `MSA-${code.slice(0, 4)}-${code.slice(4)}`
}

// SPIN_FORCE_RESULT=win | lose is for testing only (a forced win still respects the weekly cap).
function rollsAWin() {
  const forced = (process.env.SPIN_FORCE_RESULT || '').trim().toLowerCase()
  if (forced === 'lose') return false
  if (forced === 'win') return true
  return randomInt(1_000_000) / 1_000_000 < getWinChance()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // Health check: open /api/spin in a browser to confirm the function is deployed and configured
  if (req.method === 'GET') {
    const forced = (process.env.SPIN_FORCE_RESULT || '').trim()
    return res.status(200).json({
      ok: true,
      webhookConfigured: Boolean((process.env.PABBLY_SPIN_WEBHOOK_URL || process.env.PABBLY_WEBHOOK_URL || '').trim()),
      storeConfigured: storeConfigured(),
      winChance: getWinChance(),
      week: weekStart(),
      forcedResult: forced || null,
    })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body = req.body || {}
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }

  // Every spin must belong to a Test Drive item on the Monday board
  const mondayItemId = mondayItemIdFrom(body)
  if (!mondayItemId) return res.status(400).json({ error: 'Missing Monday item ID' })

  const dealer = clean(body.dealer)
  const region = clean(body.region)
  const itemKey = `spin:item:${mondayItemId}`
  const lockKey = `spin:lock:${mondayItemId}`

  let counted = false // whether this spin used up one of the dealer's weekly wins
  let winsKey = null
  try {
    // One spin per test drive: opening the link again shows the same result
    const existing = await redis('GET', itemKey)
    if (existing) return res.status(200).json({ ...JSON.parse(existing), alreadySpun: true })

    if ((await redis('SET', lockKey, '1', 'NX', 'EX', 60)) === null) {
      return res.status(409).json({ error: 'Spin already in progress' })
    }

    // Win chance applies only while this dealer still has merchandise left this week
    const week = weekStart()
    const cap = weeklyCapFor(region)
    winsKey = `wins:${week}:${slug(dealer)}`
    let won = false
    if (rollsAWin()) {
      const used = Number(await redis('INCR', winsKey))
      await redis('EXPIRE', winsKey, 21 * DAY)
      if (used <= cap) {
        won = true
        counted = true
      } else {
        await redis('DECR', winsKey)
      }
    }

    const spunAt = new Date()
    const result = {
      result: won ? 'win' : 'lose',
      prizeId: won ? PRIZE.id : null,
      prizeName: won ? PRIZE.name : null,
      claimCode: won ? makeClaimCode() : null,
      dealer,
    }

    const payload = {
      name: `Spin Result - ${won ? `WIN ${PRIZE.name}` : 'No win'}`,
      responseType: 'Spin Result',
      mondayItemId,
      surveyId: clean(body.surveyId),
      dealer,
      region,
      vehicleModel: clean(body.vehicleModel),
      spinResult: won ? 'Win' : 'Lose',
      prize: result.prizeName,
      claimCode: result.claimCode,
      weekStarting: week,
      weeklyAllocation: cap,
      spunDate: spunAt.toISOString(),
      spunDateLocal: spunAt.toLocaleString('en-ZA', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Johannesburg' }),
      device: clean(body.device, 500),
      ...spinMondayFields({ won, spunDate: spunAt.toISOString() }),
    }

    // Record every spin so wins can be verified against the claim code
    const response = await forwardToPabbly(payload, process.env.PABBLY_SPIN_WEBHOOK_URL || process.env.PABBLY_WEBHOOK_URL)
    if (!response.ok) {
      if (counted) await redis('DECR', winsKey)
      await redis('DEL', lockKey)
      return res.status(502).json({ error: 'Could not record the spin', status: response.status, pabblyMessage: summarise(response.text) })
    }

    await redis('SET', itemKey, JSON.stringify(result), 'EX', 180 * DAY)
    await redis('DEL', lockKey)
    return res.status(200).json(result)
  } catch (error) {
    console.error('Spin failed:', error)
    try {
      if (counted) await redis('DECR', winsKey)
      await redis('DEL', lockKey)
    } catch {
      // ignore clean-up errors
    }
    return res.status(500).json({ error: 'Could not complete the spin', detail: String(error?.message || error) })
  }
}

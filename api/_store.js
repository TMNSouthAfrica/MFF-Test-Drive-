// Tiny key-value store for the spin wheel: one spin per test drive + weekly win counts per dealer.
// Uses Upstash Redis over its REST API (env vars added by Vercel's Upstash integration).
// Outside production, if no store is configured, an in-memory stand-in is used for local testing.

const url = () => (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim()
const token = () => (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()

export const storeConfigured = () => Boolean(url() && token())

// In-memory fallback (local dev only)
const memory = new Map()
function memoryCommand([cmd, key, ...args]) {
  const now = Date.now()
  const entry = memory.get(key)
  const alive = entry && (!entry.expires || entry.expires > now)
  const value = alive ? entry.value : null
  switch (cmd.toUpperCase()) {
    case 'GET':
      return value
    case 'SET': {
      const nx = args.includes('NX')
      if (nx && value !== null) return null
      const exIndex = args.indexOf('EX')
      const expires = exIndex >= 0 ? now + Number(args[exIndex + 1]) * 1000 : null
      memory.set(key, { value: String(args[0]), expires })
      return 'OK'
    }
    case 'INCR':
    case 'DECR': {
      const next = Number(value || 0) + (cmd.toUpperCase() === 'INCR' ? 1 : -1)
      memory.set(key, { value: String(next), expires: alive ? entry.expires : null })
      return next
    }
    case 'EXPIRE':
      if (alive) entry.expires = now + Number(args[0]) * 1000
      return alive ? 1 : 0
    case 'DEL':
      return memory.delete(key) ? 1 : 0
    default:
      throw new Error(`Unsupported command ${cmd}`)
  }
}

export async function redis(...command) {
  if (!storeConfigured()) {
    if (process.env.VERCEL_ENV === 'production') {
      const error = new Error('Spin store is not configured (KV_REST_API_URL / KV_REST_API_TOKEN)')
      error.code = 'STORE_NOT_CONFIGURED'
      throw error
    }
    return memoryCommand(command.map(String))
  }
  const response = await fetch(url(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command.map(String)),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.error) throw new Error(`Store error: ${data.error || response.status}`)
  return data.result
}

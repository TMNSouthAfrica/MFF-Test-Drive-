// Files starting with "_" are not exposed as routes by Vercel.
const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504])

async function post(webhookUrl, body) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  const text = await response.text().catch(() => '')
  return { ok: response.ok, status: response.status, text }
}

// Returns { ok, status, text }. Retries once on a network error or a temporary Pabbly failure.
export async function forwardToPabbly(payload, url = process.env.PABBLY_WEBHOOK_URL) {
  const webhookUrl = (url || '').trim()
  if (!webhookUrl) {
    const error = new Error('PABBLY_WEBHOOK_URL is not set')
    error.code = 'NOT_CONFIGURED'
    throw error
  }
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload)

  let result
  try {
    result = await post(webhookUrl, body)
  } catch (error) {
    console.error('Pabbly request failed, retrying once:', error)
    await new Promise((r) => setTimeout(r, 700))
    return post(webhookUrl, body)
  }
  if (!result.ok && RETRYABLE.has(result.status)) {
    console.error('Pabbly responded with status', result.status, result.text.slice(0, 500), '- retrying once')
    await new Promise((r) => setTimeout(r, 700))
    result = await post(webhookUrl, body)
  }
  if (!result.ok) {
    console.error('Pabbly responded with status', result.status, result.text.slice(0, 500))
  }
  return result
}

// Short, plain-text version of Pabbly's reply for error responses
export const summarise = (text) =>
  String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)

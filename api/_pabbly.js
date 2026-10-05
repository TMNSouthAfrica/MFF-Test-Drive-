// Files starting with "_" are not exposed as routes by Vercel.
export async function forwardToPabbly(payload, url = process.env.PABBLY_WEBHOOK_URL) {
  const webhookUrl = (url || '').trim()
  if (!webhookUrl) {
    const error = new Error('PABBLY_WEBHOOK_URL is not set')
    error.code = 'NOT_CONFIGURED'
    throw error
  }
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    console.error('Pabbly responded with status', response.status, text.slice(0, 500))
  }
  return response
}

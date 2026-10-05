import { forwardToPabbly } from './_pabbly.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const webhookUrl = (process.env.PABBLY_WEBHOOK_URL || '').trim()

  // Health check: open /api/submit in a browser to confirm the function is deployed and configured
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      webhookConfigured: Boolean(webhookUrl),
      webhookLooksValid: /^https:\/\/connect\.pabbly\.com\//.test(webhookUrl),
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!webhookUrl) {
    console.error('PABBLY_WEBHOOK_URL is not set')
    return res.status(500).json({ error: 'Webhook not configured' })
  }

  try {
    const pabblyResponse = await forwardToPabbly(req.body, webhookUrl)

    if (!pabblyResponse.ok) {
      return res.status(502).json({ error: 'Pabbly rejected the submission', status: pabblyResponse.status })
    }

    return res.status(200).json({ success: true, status: pabblyResponse.status })
  } catch (error) {
    console.error('Failed to forward to Pabbly:', error)
    return res.status(500).json({ error: 'Failed to forward to Pabbly', detail: String(error?.message || error) })
  }
}

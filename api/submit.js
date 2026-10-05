export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookUrl = process.env.PABBLY_WEBHOOK_URL
  if (!webhookUrl) {
    console.error('PABBLY_WEBHOOK_URL is not set')
    return res.status(500).json({ error: 'Webhook not configured' })
  }

  try {
    const pabblyResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })

    if (!pabblyResponse.ok) {
      console.error('Pabbly responded with status', pabblyResponse.status)
      return res.status(502).json({ error: 'Pabbly rejected the submission', status: pabblyResponse.status })
    }

    return res.status(200).json({ success: true, status: pabblyResponse.status })
  } catch (error) {
    console.error('Failed to forward to Pabbly:', error)
    return res.status(500).json({ error: 'Failed to forward to Pabbly' })
  }
}

# Mahindra South Africa — Test Drive Experience Survey

Mobile-first post-test-drive survey (React 19 + Vite + Tailwind). Submissions go to `/api/submit`, a Vercel function that forwards the JSON to a Pabbly Connect webhook.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

`/api/submit` only runs on Vercel (or `vercel dev`).

## Configuration

| Where | What |
|---|---|
| Vercel → Settings → Environment Variables | `PABBLY_WEBHOOK_URL` (required) |
| `public/` | `mahindra-logo.png` (colour, welcome card), `mahindra-logo-white.png` (header) — both generated from `design/mahindra-logo-source.jpg`; `icon.svg`, `apple-icon.png`, `icon-light-32x32.png`, `icon-dark-32x32.png`. Until the logo is added, a "MAHINDRA" text wordmark is shown. |

## URL parameters

`/?id=12345&dealer=Mahindra%20Sandton&expires=2026-10-12`

- `id` → `surveyId` in the payload
- `dealer` → `dealer` in the payload, and appended to every question title
- `expires` → after 23:59:59 local time on that date the Expired screen is shown

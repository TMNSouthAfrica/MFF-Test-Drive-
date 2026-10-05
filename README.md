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
| Vercel → Settings → Environment Variables | `PABBLY_WEBHOOK_URL` (required). Optional spin settings: see `.env.example` |
| `public/` | `mahindra-logo.png` (used on every screen, including the header), `mahindra-logo-white.png` (spare white version) — both generated from `design/mahindra-logo-source.jpg` by `python3 design/make-logos.py`; `icon.svg`, `apple-icon.png`, `icon-light-32x32.png`, `icon-dark-32x32.png`. Until the logo is added, a "MAHINDRA" text wordmark is shown. |

## URL parameters

`/?id=12345&dealer=Mahindra%20Sandton&expires=2026-10-12`

- `id` → `surveyId` in the payload
- `dealer` → `dealer` in the payload, and appended to every question title
- `expires` → after 23:59:59 local time on that date the Expired screen is shown

## Spin to win (thank-you page)

After submitting, customers get one spin of a prize wheel (`src/components/SpinWheel.jsx`).

- **The server decides the result.** `api/spin.js` draws win/lose (`SPIN_WIN_CHANCE`, default 3%), then the wheel animates to land on it. The browser cannot choose its own result.
- **Every spin is recorded** in Pabbly with `responseType: "Spin Result"`, `spinResult`, `prize` and a `claimCode` (e.g. `MSA-7KQ2-X9PD`), plus `surveyId`, `dealer` and `vehicleModel`. Verify winners' claim codes against these records. If recording fails, no result is shown.
- **Prizes and wheel layout** are in `src/config/prizes.js`; vehicle photos are in `public/prizes/`.
- **One spin per submission.** Every completed submission gets a fresh spin, including resubmissions from the same link. To limit wins per customer, filter by `surveyId` in Pabbly.
- **Respins (testing):** `ALLOW_RESPIN` in `src/config/prizes.js` is currently `true`, which shows a "Spin again" button after every result. Set it to `false` before going live.
- **Testing:** set `SPIN_FORCE_RESULT=win` (or `lose`, `3xo`, `xuv700`, `scorpio-n`) on a Preview deployment only.

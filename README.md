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

`/?itemId=1234567890&model=XUV700&dealer=Mahindra%20Sandton&region=Gauteng&id=12345&expires=2026-10-12`

- `itemId` (**required**) → `mondayItemId` in both the survey and spin payloads: the Monday item ID of the customer's Test Drive, so Pabbly can update that item. Must be numeric. Without it the "Invalid Survey Link" screen is shown, and `/api/submit` and `/api/spin` reject the request with 400.
- `model` (optional) → pre-selects the vehicle on question 1 (the customer can still change it). Accepts `3XO`, `XUV700` (also the board's `XUV7OO`), `Scorpio N`/`Scorpio-N`, `PIK UP Single Cab`, `PIK UP Double Cab`; case, spaces and dashes are ignored. Unknown values are ignored. URL-encode spaces (`Scorpio%20N`).
- `id` → `surveyId` in the payload
- `dealer` → `dealer` in the payload, appended to every question title, and the dealership whose weekly merchandise allocation a win uses
- `region` → the dealership's region (the board's Region field); sets the weekly merchandise allocation (see below)
- `expires` → after 23:59:59 local time on that date the Expired screen is shown

## monday.com board

Pabbly workflow "Test Drive Survey Submission Capture" routes on `responseType` and writes each answer to the Test Drive item (`mondayItemId`) on the **MFF Dealership Test Drives** board, one "Update Item Column Value" step per column. `api/_monday.js` adds board-ready fields to the payloads (`mondaySurveyStatus`, `mondayGrandPrizeEligible`, `mondayLowRating`, `mondayDissatisfactionReasons`, `mondaySurveyDate`, `mondayPopiaConsent`, `mondaySpinStatus`, `mondaySpinDate`). Their values must match the board's status/dropdown labels.

## Spin to win (thank-you page)

After submitting, customers get **one** spin of the wheel (`src/components/SpinWheel.jsx`). Phase 1 of the MFF brief (p.4): **Mahindra merchandise only, win / no win**; winners collect at the dealership with their claim code.

- **One spin per test drive.** The result is stored against the Monday item ID; opening the link again replays the same result (no new spin).
- **Weekly merchandise allocation per dealership, by region** (`src/config/prizes.js`): Gauteng 5, Western Cape 10, KwaZulu-Natal 10 (also `KZN`), every other region 1 per dealership per week. Weeks reset Monday 00:00 SAST.
- **The server decides the result.** While the dealer still has merchandise left this week, a spin wins with probability `SPIN_WIN_CHANCE` (default 30%); once the allocation is used up, every spin is "No luck" until Monday.
- **Storage:** Upstash Redis via Vercel's Marketplace (`KV_REST_API_URL` / `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`). Required in production; locally an in-memory stand-in is used. Open `/api/spin` to see `storeConfigured`, `winChance` and the current `week`.
- **Every spin is recorded** in Pabbly with `responseType: "Spin Result"`, `spinResult`, `prize`, `claimCode` (e.g. `MSA-7KQ2-X9PD`), `dealer`, `region`, `weekStarting`, `weeklyAllocation`, `mondayItemId` and `vehicleModel`. If recording fails, the spin is undone and the customer can try again.
- **Testing:** `SPIN_FORCE_RESULT=win` or `lose` on a Preview deployment only (a forced win still respects the weekly allocation).

# AdChad — project rules

## Public domain: always `adchad.ai`, never `*.vercel.app`

Every user-facing URL — emails, X roast replies, the `/p/<id>` sales link, Stripe `success_url`/redirects, anything a
real person sees or clicks — MUST use `https://adchad.ai`. Never emit a `*.vercel.app` URL.

- `APP_URL` is `https://adchad.ai` in prod (Vercel env) and `.env.prod`. Do not set it to a `vercel.app` host anywhere
  that ships or sends mail.
- Code fallbacks for `process.env.APP_URL` must be `https://adchad.ai` (or `http://localhost:3000` for pure local dev),
  never `https://adchad.vercel.app`.
- For local full-checkout testing you may temporarily set `APP_URL=http://localhost:3000` in `.env.local`, but restore
  it to `https://adchad.ai` after.

## Env vars must reach prod

When a feature reads a new `process.env.*` (e.g. `MAILING_ADDRESS`, `STRIPE_PRICE_RETAINER`), set it in **Vercel prod
env** too — not just `.env.local`. A value missing in prod ships a broken artifact (e.g. an email footer showing
`<set MAILING_ADDRESS>`). Mirror it into `.env.prod` for reference and `vercel env add … production`, then redeploy.

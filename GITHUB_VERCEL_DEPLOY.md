# Bill'em Invoice: GitHub + Vercel Deployment Guide

This guide walks you through:
1. Pushing this project to GitHub
2. Deploying the web app to Vercel
3. Connecting Supabase functions and environment variables

---

## 1) Prepare the repo locally

From the project root:

```bash
cd "/Users/BOCCI/Documents/New project"
```

Optional sanity checks:

```bash
npx tsc --noEmit
npm run lint
```

---

## 2) Create a GitHub repository and push code

1. Create a new empty GitHub repo (for example: `billem-invoice`).
2. In terminal, run:

```bash
git init
git add .
git commit -m "Initial Bill'em Invoice setup"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```

If this folder is already a git repo, skip `git init` and only set/push remote.

---

## 3) Create a Vercel project

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo.
3. Framework preset: choose **Other** (or leave auto-detected if Vercel picks correctly).
4. Configure:
   - Build Command: `npx expo export --platform web`
   - Output Directory: `dist`
   - Install Command: `npm install`

Then click **Deploy**.

---

## 4) Add Vercel environment variables

In Vercel project settings, add:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_PAYMENT_BASE_URL=https://<your-vercel-domain>
```

After adding env vars, trigger a redeploy.

---

## 5) Deploy Supabase functions

Install Supabase CLI (if not installed):

```bash
brew install supabase/tap/supabase
```

Login and link project:

```bash
supabase login
supabase link --project-ref <YOUR_SUPABASE_PROJECT_REF>
```

Push DB migration:

```bash
supabase db push
```

Set function secrets:

```bash
supabase secrets set OPENAI_API_KEY=...
supabase secrets set OPENAI_VISION_MODEL=gpt-4o-mini
supabase secrets set STRIPE_SECRET_KEY=...
supabase secrets set STRIPE_WEBHOOK_SECRET=...
supabase secrets set STRIPE_PRICE_PRO_MONTHLY=...
supabase secrets set STRIPE_PRICE_BUSINESS_MONTHLY=...
supabase secrets set STRIPE_CONNECT_ACCOUNT_ID=...
supabase secrets set PUBLIC_PAYMENT_BASE_URL=https://<your-vercel-domain>
supabase secrets set RESEND_API_KEY=...
supabase secrets set SENDGRID_API_KEY=...
supabase secrets set INVOICE_FROM_EMAIL=invoices@<your-domain>
supabase secrets set PAYMENT_GATEWAY_ENCRYPTION_KEY=<random-32+-char-secret>
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

Deploy all required functions:

```bash
supabase functions deploy ai-extract-invoice
supabase functions deploy send-invoice-email
supabase functions deploy create-invoice-payment
supabase functions deploy create-subscription-checkout
supabase functions deploy configure-payment-gateway
supabase functions deploy stripe-webhook
supabase functions deploy address-autocomplete
supabase functions deploy email-service-status
```

---

## 6) Configure Stripe webhooks

In Stripe dashboard:

1. Add webhook endpoint:
   - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`
2. Subscribe to at least:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
3. Copy webhook signing secret and set it in Supabase:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

Redeploy `stripe-webhook` function if needed.

---

## 7) Production checklist

Before going live:

- Stripe keys are **live** keys
- `EXPO_PUBLIC_PAYMENT_BASE_URL` points to your Vercel domain
- `PUBLIC_PAYMENT_BASE_URL` in Supabase matches Vercel domain
- At least one email provider is configured (`RESEND_API_KEY` or `SENDGRID_API_KEY`)
- Gateway connection tested in app Settings (`Stripe` + `PayPal`)
- Send test invoice and confirm:
  - payment link opens
  - email sends
  - webhook event reaches Supabase

---

## 8) Update flow

After initial setup, deploying updates is simple:

```bash
git add .
git commit -m "Your update message"
git push
```

Vercel auto-deploys from `main`.


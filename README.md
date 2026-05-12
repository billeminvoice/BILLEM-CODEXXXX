# Bill'em Invoice

Production-ready Expo + Supabase invoicing app focused on AI invoice creation. Users can sign up, complete business or personal onboarding, scan invoices/receipts/screenshots, edit drafts, generate PDFs, email invoices, and send payment links.

## Run Locally

```bash
npm install
npm run start
```

## Required Environment

Client `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_PAYMENT_BASE_URL=https://your-domain.com
```

Supabase function secrets:

```bash
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=gpt-4o-mini
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_CONNECT_ACCOUNT_ID=acct_... # optional platform payout destination
PUBLIC_PAYMENT_BASE_URL=https://your-domain.com
RESEND_API_KEY=... # or SENDGRID_API_KEY
INVOICE_FROM_EMAIL=invoices@your-domain.com
PAYMENT_GATEWAY_ENCRYPTION_KEY=32+ character random secret
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Deploy functions:

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

Run migrations:

```bash
supabase db push
```

## Payment Flow

Invoices create Stripe Checkout links when `STRIPE_SECRET_KEY` is configured. If Stripe is not configured, invoices still generate a public `/pay/:invoiceId` link so email/PDF flows continue to work while backend keys are being added.

Gateway setup supports Stripe and PayPal. The app sends credentials to the backend when configured and only stores masked connection metadata on device.

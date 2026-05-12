import { corsHeaders } from '../_shared/cors.ts';

const cents = (amount: number) => Math.max(50, Math.round(Number(amount || 0) * 100));

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const {
      invoice,
      business,
      gateway = 'stripe',
      platformFeePercent,
      instantPayoutsEnabled,
    } = await req.json();

    if (!invoice?.id || !invoice?.total || !invoice?.currency) {
      return json({ success: false, error: 'Invoice id, total, and currency are required' }, 400);
    }

    if (gateway !== 'stripe') {
      return json(
        {
          success: false,
          error: `${gateway} payment creation is not enabled on this backend yet. Set Stripe as the default gateway or deploy a provider adapter for ${gateway}.`,
        },
        422
      );
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const publicBaseUrl = Deno.env.get('PUBLIC_PAYMENT_BASE_URL') || 'https://billem.app';
    const stripeConnectAccount = Deno.env.get('STRIPE_CONNECT_ACCOUNT_ID') || '';

    if (!stripeSecretKey) {
      return json({
        success: true,
        data: {
          url: `${publicBaseUrl.replace(/\/$/, '')}/pay/${encodeURIComponent(invoice.id)}`,
          mode: 'public-link',
        },
      });
    }

    const amount = cents(invoice.total);
    const applicationFeeAmount = stripeConnectAccount
      ? Math.round(amount * (Math.max(0, Number(platformFeePercent) || 0) / 100))
      : undefined;

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', `${publicBaseUrl.replace(/\/$/, '')}/pay/${encodeURIComponent(invoice.id)}?status=paid&session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${publicBaseUrl.replace(/\/$/, '')}/pay/${encodeURIComponent(invoice.id)}?status=cancelled`);
    params.set('customer_email', invoice.clientEmail || '');
    params.set('client_reference_id', invoice.id);
    params.set('metadata[invoice_id]', invoice.id);
    params.set('metadata[invoice_number]', invoice.invoiceNumber || '');
    params.set('metadata[instant_payout_requested]', instantPayoutsEnabled ? 'true' : 'false');
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', String(invoice.currency).toLowerCase());
    params.set('line_items[0][price_data][unit_amount]', String(amount));
    params.set('line_items[0][price_data][product_data][name]', `Invoice ${invoice.invoiceNumber || invoice.id}`);
    params.set('line_items[0][price_data][product_data][description]', `Payment to ${business?.name || "Bill'em Invoice"}`);

    if (stripeConnectAccount) {
      params.set('payment_intent_data[transfer_data][destination]', stripeConnectAccount);
    }
    if (applicationFeeAmount && applicationFeeAmount > 0) {
      params.set('payment_intent_data[application_fee_amount]', String(applicationFeeAmount));
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const stripeData = await stripeResponse.json();
    if (!stripeResponse.ok) {
      return json({ success: false, error: stripeData?.error?.message || 'Stripe checkout session failed' }, 502);
    }

    return json({
      success: true,
      data: {
        url: stripeData.url,
        sessionId: stripeData.id,
        mode: stripeConnectAccount ? 'stripe-connect' : 'stripe-checkout',
      },
    });
  } catch (error: any) {
    return json({ success: false, error: error.message || 'Could not create payment link' }, 500);
  }
});

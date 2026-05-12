import { corsHeaders } from '../_shared/cors.ts';

const PRICE_ENV: Record<string, string> = {
  pro: 'STRIPE_PRICE_PRO_MONTHLY',
  business: 'STRIPE_PRICE_BUSINESS_MONTHLY',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { planId, email, successUrl, cancelUrl } = await req.json();
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const priceId = Deno.env.get(PRICE_ENV[planId]);

    if (!stripeSecretKey || !priceId) {
      return json({ success: false, error: `Stripe subscription billing is missing ${PRICE_ENV[planId] || 'price configuration'}` }, 500);
    }

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('success_url', successUrl);
    params.set('cancel_url', cancelUrl);
    params.set('customer_email', email || '');
    params.set('metadata[plan_id]', planId);
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price]', priceId);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const data = await response.json();
    if (!response.ok) {
      return json({ success: false, error: data?.error?.message || 'Stripe subscription checkout failed' }, 502);
    }

    return json({ success: true, data: { url: data.url, sessionId: data.id } });
  } catch (error: any) {
    return json({ success: false, error: error.message || 'Could not create subscription checkout' }, 500);
  }
});

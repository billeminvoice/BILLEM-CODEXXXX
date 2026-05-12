import { corsHeaders } from '../_shared/cors.ts';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string) {
  const timestamp = signatureHeader.split(',').find((part) => part.startsWith('t='))?.slice(2);
  const signature = signatureHeader.split(',').find((part) => part.startsWith('v1='))?.slice(3);
  if (!timestamp || !signature) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signedPayload = `${timestamp}.${rawBody}`;
  const digest = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload));
  const expected = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return expected === signature;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const rawBody = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (webhookSecret) {
      const signature = req.headers.get('stripe-signature') || '';
      const verified = await verifyStripeSignature(rawBody, signature, webhookSecret);
      if (!verified) return json({ received: false, error: 'Invalid Stripe signature' }, 401);
    }
    const event = JSON.parse(rawBody);
    const session = event?.data?.object || {};
    const invoiceId = session?.metadata?.invoice_id || session?.client_reference_id || '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (invoiceId && supabaseUrl && serviceRoleKey) {
      await fetch(`${supabaseUrl}/rest/v1/invoice_payment_events`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          gateway: 'stripe',
          event_type: event.type,
          amount: session.amount_total || session.amount_paid || null,
          currency: session.currency || null,
          raw_event: event,
        }),
      });
    }

    return json({ received: true });
  } catch (error: any) {
    return json({ received: false, error: error.message || 'Webhook failed' }, 400);
  }
});

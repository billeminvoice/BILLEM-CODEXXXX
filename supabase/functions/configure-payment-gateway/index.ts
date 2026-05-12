import { corsHeaders } from '../_shared/cors.ts';

const SUPPORTED = new Set(['stripe', 'paypal']);

async function encryptJson(value: unknown, secret: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(secret));
  const key = await crypto.subtle.importKey('raw', keyMaterial, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)));
  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    algorithm: 'AES-GCM',
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { gatewayId, credentials } = await req.json();
    if (!SUPPORTED.has(gatewayId)) {
      return json({ success: false, error: 'Unsupported payment gateway' }, 400);
    }
    if (!credentials || typeof credentials !== 'object') {
      return json({ success: false, error: 'Credentials are required' }, 400);
    }

    const missing = Object.entries(credentials).filter(([, value]) => !String(value || '').trim());
    if (missing.length > 0) {
      return json({ success: false, error: 'All credential fields are required' }, 400);
    }

    const encryptionKey = Deno.env.get('PAYMENT_GATEWAY_ENCRYPTION_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!encryptionKey || !supabaseUrl || !serviceRoleKey) {
      return json({
        success: true,
        data: {
          gatewayId,
          configuredFields: Object.keys(credentials),
          storage: 'client-status-only',
        },
      });
    }

    const encryptedCredentials = await encryptJson(credentials, encryptionKey);
    const response = await fetch(`${supabaseUrl}/rest/v1/payment_gateway_connections`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        gateway_id: gatewayId,
        encrypted_credentials: encryptedCredentials,
        configured_fields: Object.keys(credentials),
        connected_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return json({ success: false, error: text || 'Could not store gateway credentials' }, 502);
    }

    return json({
      success: true,
      data: {
        gatewayId,
        configuredFields: Object.keys(credentials),
        storage: 'supabase',
      },
    });
  } catch (error: any) {
    return json({ success: false, error: error.message || 'Gateway setup failed' }, 500);
  }
});

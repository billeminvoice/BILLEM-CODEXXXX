import { corsHeaders } from '../_shared/cors.ts';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type Suggestion = {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

function parseAddress(input: any): Suggestion {
  const address = input?.address || {};
  const street = [address.house_number, address.road].filter(Boolean).join(' ').trim();
  const city = address.city || address.town || address.village || '';
  const state = address.state || '';
  const zipCode = address.postcode || '';
  const country = address.country || '';
  const label = input?.display_name || [street, city, state, zipCode, country].filter(Boolean).join(', ');
  return {
    id: String(input?.place_id || label),
    label,
    street,
    city,
    state,
    zipCode,
    country,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || String(query).trim().length < 3) return json({ success: true, data: [] });

    const encoded = encodeURIComponent(String(query).trim());
    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=jsonv2&addressdetails=1&limit=6&countrycodes=us,ca,gb,au`;
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': "Bill'em Invoice Address Lookup",
      },
    });
    if (!response.ok) return json({ success: true, data: [] });

    const results = await response.json();
    const suggestions = Array.isArray(results) ? results.map(parseAddress) : [];
    return json({ success: true, data: suggestions });
  } catch (error: any) {
    return json({ success: false, error: error.message || 'Address lookup failed', data: [] }, 500);
  }
});

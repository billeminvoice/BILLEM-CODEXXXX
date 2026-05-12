import { corsHeaders } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `You are an expert invoice data extractor. Analyze the provided document and extract invoice-related information.

Return ONLY a valid JSON object with this exact structure:
{
  "clientName": "",
  "clientEmail": "",
  "clientPhone": "",
  "clientAddress": "",
  "lineItems": [
    { "description": "", "quantity": 1, "rate": 0.0 }
  ],
  "subtotal": 0.0,
  "taxRate": 0.0,
  "discountValue": 0.0,
  "discountType": "percent",
  "notes": "",
  "dueDate": "",
  "issueDate": "",
  "invoiceNumber": "",
  "currency": "USD",
  "confidence": 0.9
}

Rules:
- Extract all visible line items.
- If quantity is missing, use 1.
- If only an amount is visible for a line item, use quantity=1 and rate=that amount.
- taxRate is a percentage number (e.g. 8.25).
- discountValue is percentage unless clearly fixed amount.
- Never invent data not visible in the document.
- Never return markdown fences or extra commentary.`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toNumber(v: unknown, fallback = 0) {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

function toDateOrEmpty(v: unknown) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

function sanitizeResult(extracted: any) {
  const lineItems = Array.isArray(extracted?.lineItems)
    ? extracted.lineItems
        .map((li: any) => ({
          description: String(li?.description || '').trim(),
          quantity: Math.max(0, toNumber(li?.quantity, 1)),
          rate: Math.max(0, toNumber(li?.rate, 0)),
        }))
        .filter((li: any) => li.description || li.rate > 0)
    : [];

  return {
    clientName: String(extracted?.clientName || '').trim(),
    clientEmail: String(extracted?.clientEmail || '').trim(),
    clientPhone: String(extracted?.clientPhone || '').trim(),
    clientAddress: String(extracted?.clientAddress || '').trim(),
    lineItems: lineItems.length > 0 ? lineItems : [{ description: 'Service', quantity: 1, rate: 0 }],
    subtotal: Math.max(0, toNumber(extracted?.subtotal, 0)),
    taxRate: Math.max(0, toNumber(extracted?.taxRate, 0)),
    discountValue: Math.max(0, toNumber(extracted?.discountValue, 0)),
    discountType: extracted?.discountType === 'fixed' ? 'fixed' : 'percent',
    notes: String(extracted?.notes || '').trim(),
    dueDate: toDateOrEmpty(extracted?.dueDate),
    issueDate: toDateOrEmpty(extracted?.issueDate),
    invoiceNumber: String(extracted?.invoiceNumber || '').trim(),
    currency: String(extracted?.currency || 'USD').toUpperCase().slice(0, 3),
    confidence: Math.min(1, Math.max(0, toNumber(extracted?.confidence, 0.8))),
  };
}

function parseModelJson(raw: string) {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse AI response as JSON');
    return JSON.parse(match[0]);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { imageBase64, imageUrl } = await req.json();
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    const model = Deno.env.get('OPENAI_VISION_MODEL') || 'gpt-4o-mini';

    if (!apiKey) {
      return json({ success: false, error: 'OPENAI_API_KEY is missing in Supabase function secrets.' }, 500);
    }

    const inputImageUrl = imageBase64 || imageUrl;
    if (!inputImageUrl) return json({ success: false, error: 'No image provided' }, 400);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: SYSTEM_PROMPT },
              { type: 'image_url', image_url: { url: inputImageUrl, detail: 'high' } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1800,
      }),
    });

    const rawResponse = await response.text();
    if (!response.ok) {
      return json(
        { success: false, error: `OpenAI request failed: ${rawResponse.slice(0, 500)}` },
        502
      );
    }

    const parsed = JSON.parse(rawResponse);
    const content = parsed?.choices?.[0]?.message?.content || '';
    const extracted = parseModelJson(String(content));
    const data = sanitizeResult(extracted);
    return json({ success: true, data });
  } catch (error: any) {
    return json({ success: false, error: error?.message || 'Extraction failed' }, 500);
  }
});

import { corsHeaders } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `You are an expert invoice data extractor. Analyze the provided image and extract all invoice-related information with maximum accuracy.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "clientName": "extracted business or person name (string, or empty string if not found)",
  "clientEmail": "extracted email (string, or empty string if not found)",
  "clientPhone": "extracted phone (string, or empty string if not found)",
  "clientAddress": "extracted address (string, or empty string if not found)",
  "lineItems": [
    {
      "description": "item description (string)",
      "quantity": 1,
      "rate": 0.00
    }
  ],
  "subtotal": 0.00,
  "taxRate": 0.00,
  "discountValue": 0.00,
  "discountType": "percent",
  "notes": "any payment notes or special instructions (string)",
  "dueDate": "YYYY-MM-DD format due date (string, or empty if not found)",
  "issueDate": "YYYY-MM-DD format issue date (string, or empty if not found)",
  "invoiceNumber": "invoice number if visible (string, or empty)",
  "currency": "3-letter currency code like USD, EUR, GBP (string)",
  "confidence": 0.95
}

Rules:
- Extract ALL line items visible in the image
- If the source is a chat screenshot, estimate line items from the discussed work, quantities, and prices
- Prefer the buyer/client name over the sender/business name when both are visible
- Calculate quantity × rate for each item and reconcile with visible subtotal/total
- If quantity is missing, use 1
- If a line shows only an amount, use quantity 1 and rate equal to that amount
- Set taxRate as a percentage number (e.g., 8.5 for 8.5%)
- Set discountValue as a percentage number
- If currency symbol is $, use USD. If £, use GBP. If €, use EUR.
- confidence should be between 0 and 1 based on image clarity
- Do not invent emails, phone numbers, addresses, taxes, or invoice numbers that are not visible
- NEVER include markdown fences or extra text — only the JSON object`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, imageUrl } = await req.json();

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    const baseUrl = 'https://api.openai.com/v1';
    const model = Deno.env.get('OPENAI_VISION_MODEL') || 'gpt-4o-mini';

    if (!apiKey) {
      throw new Error('AI extraction is not configured. Add OPENAI_API_KEY.');
    }

    // Build image content part
    let imageContent: any;
    if (imageBase64) {
      imageContent = {
        type: 'image_url',
        image_url: {
          url: imageBase64, // already formatted as data:image/jpeg;base64,...
        },
      };
    } else if (imageUrl) {
      imageContent = {
        type: 'image_url',
        image_url: { url: imageUrl },
      };
    } else {
      throw new Error('No image provided');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: SYSTEM_PROMPT,
              },
              imageContent,
            ],
          },
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? '';

    // Strip markdown fences if present
    const jsonStr = rawContent
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .trim();

    let extracted: any;
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      // Try to find JSON object in response
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        extracted = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Validate and sanitize
    const result = {
      clientName: String(extracted.clientName || ''),
      clientEmail: String(extracted.clientEmail || ''),
      clientPhone: String(extracted.clientPhone || ''),
      clientAddress: String(extracted.clientAddress || ''),
      lineItems: Array.isArray(extracted.lineItems)
        ? extracted.lineItems.map((li: any) => ({
            description: String(li.description || ''),
            quantity: parseFloat(li.quantity) || 1,
            rate: parseFloat(li.rate) || 0,
          }))
        : [],
      subtotal: parseFloat(extracted.subtotal) || 0,
      taxRate: parseFloat(extracted.taxRate) || 0,
      discountValue: parseFloat(extracted.discountValue) || 0,
      discountType: extracted.discountType === 'fixed' ? 'fixed' : 'percent',
      notes: String(extracted.notes || ''),
      dueDate: String(extracted.dueDate || ''),
      issueDate: String(extracted.issueDate || ''),
      invoiceNumber: String(extracted.invoiceNumber || ''),
      currency: String(extracted.currency || 'USD'),
      confidence: Math.min(1, Math.max(0, parseFloat(extracted.confidence) || 0.8)),
    };

    // Ensure lineItems are not empty
    if (result.lineItems.length === 0) {
      result.lineItems = [{ description: 'Service', quantity: 1, rate: 0 }];
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('AI Extract error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Extraction failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      clientEmail,
      clientName,
      invoiceNumber,
      total,
      dueDate,
      currency,
      paymentLink,
      businessName,
      businessEmail,
      lineItems,
      subtotal,
      taxAmount,
      discountAmount,
      notes,
    } = await req.json();

    if (!clientEmail) {
      throw new Error('Client email is required');
    }

    const fmt = (n: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(n);

    const fmtDate = (d: string) =>
      new Date(d).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

    const lineItemsHtml = (lineItems || [])
      .map(
        (li: any) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#0F172A;font-size:14px">${li.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#475569;font-size:14px;text-align:center">${li.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#475569;font-size:14px;text-align:right">${fmt(li.rate)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#0F172A;font-size:14px;text-align:right;font-weight:600">${fmt(li.amount || li.quantity * li.rate)}</td>
      </tr>`
      )
      .join('');

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px 16px">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#3B82F6 0%,#818CF8 60%,#F472B6 100%);border-radius:16px 16px 0 0;padding:32px">
          <tr>
            <td>
              <div style="color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Invoice from</div>
              <div style="color:#ffffff;font-size:22px;font-weight:700;margin-bottom:4px">${businessName || "Bill'em Invoice"}</div>
              ${businessEmail ? `<div style="color:rgba(255,255,255,0.8);font-size:14px">${businessEmail}</div>` : ''}
            </td>
            <td style="text-align:right;vertical-align:top">
              <div style="background:rgba(255,255,255,0.2);border-radius:10px;padding:12px 18px;display:inline-block">
                <div style="color:rgba(255,255,255,0.85);font-size:12px;font-weight:600;letter-spacing:0.5px">INVOICE</div>
                <div style="color:#ffffff;font-size:18px;font-weight:700">${invoiceNumber}</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Amount due card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:28px 32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0">
          <tr>
            <td>
              <div style="color:#475569;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px">Amount Due</div>
              <div style="color:#0F172A;font-size:36px;font-weight:700;margin-bottom:4px">${fmt(total)}</div>
              <div style="color:#94A3B8;font-size:14px">Due ${fmtDate(dueDate)}</div>
            </td>
            <td style="text-align:right;vertical-align:middle">
              <a href="${paymentLink}" style="display:inline-block;background:linear-gradient(135deg,#3B82F6,#818CF8);color:#ffffff;font-size:15px;font-weight:600;padding:14px 28px;border-radius:10px;text-decoration:none">
                Pay Now →
              </a>
            </td>
          </tr>
        </table>

        <!-- Bill to -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:20px 32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0">
          <tr>
            <td>
              <div style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px">Billed To</div>
              <div style="color:#0F172A;font-size:15px;font-weight:600">${clientName}</div>
              <div style="color:#475569;font-size:14px">${clientEmail}</div>
            </td>
          </tr>
        </table>

        <!-- Line items -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0">
          <tr>
            <td style="padding:20px 32px 12px">
              <div style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px">Line Items</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden">
                <tr style="background:#F8FAFC">
                  <th style="padding:10px 12px;text-align:left;color:#475569;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Description</th>
                  <th style="padding:10px 12px;text-align:center;color:#475569;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Qty</th>
                  <th style="padding:10px 12px;text-align:right;color:#475569;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Rate</th>
                  <th style="padding:10px 12px;text-align:right;color:#475569;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Amount</th>
                </tr>
                ${lineItemsHtml}
                <!-- Totals -->
                <tr><td colspan="4" style="padding:16px 12px 0;border-top:2px solid #E2E8F0"></td></tr>
                ${subtotal ? `<tr><td colspan="3" style="padding:4px 12px;text-align:right;color:#475569;font-size:14px">Subtotal</td><td style="padding:4px 12px;text-align:right;color:#0F172A;font-size:14px">${fmt(subtotal)}</td></tr>` : ''}
                ${discountAmount > 0 ? `<tr><td colspan="3" style="padding:4px 12px;text-align:right;color:#475569;font-size:14px">Discount</td><td style="padding:4px 12px;text-align:right;color:#10B981;font-size:14px">-${fmt(discountAmount)}</td></tr>` : ''}
                ${taxAmount > 0 ? `<tr><td colspan="3" style="padding:4px 12px;text-align:right;color:#475569;font-size:14px">Tax</td><td style="padding:4px 12px;text-align:right;color:#0F172A;font-size:14px">${fmt(taxAmount)}</td></tr>` : ''}
                <tr>
                  <td colspan="3" style="padding:12px 12px;text-align:right;color:#0F172A;font-size:16px;font-weight:700;border-top:1px solid #E2E8F0">Total Due</td>
                  <td style="padding:12px 12px;text-align:right;color:#3B82F6;font-size:16px;font-weight:700;border-top:1px solid #E2E8F0">${fmt(total)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height:24px"></td></tr>
        </table>

        ${notes ? `
        <!-- Notes -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;padding:20px 32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0">
          <tr>
            <td>
              <div style="color:#3B82F6;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px">Notes</div>
              <div style="color:#475569;font-size:14px;line-height:1.6">${notes}</div>
            </td>
          </tr>
        </table>` : ''}

        <!-- CTA footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:28px 32px;border-radius:0 0 16px 16px;text-align:center">
          <tr>
            <td>
              <div style="color:rgba(255,255,255,0.7);font-size:14px;margin-bottom:16px">Click the button below to pay your invoice securely online</div>
              <a href="${paymentLink}" style="display:inline-block;background:linear-gradient(135deg,#3B82F6,#818CF8);color:#ffffff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none">
                Pay ${fmt(total)} Now
              </a>
              <div style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:16px">
                Powered by Bill'em Invoice · Secure payment processing
              </div>
            </td>
          </tr>
        </table>

        <div style="text-align:center;padding:16px;color:#94A3B8;font-size:12px">
          This invoice was sent by ${businessName || "Bill'em Invoice"} · Invoice ${invoiceNumber}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailData = {
      to: clientEmail,
      toName: clientName,
      subject: `Invoice ${invoiceNumber} — ${fmt(total)} due ${fmtDate(dueDate)}`,
      html: htmlBody,
      paymentLink,
    };

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('INVOICE_FROM_EMAIL') || businessEmail;

    if (resendApiKey && fromEmail) {
      const sent = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${businessName || "Bill'em Invoice"} <${fromEmail}>`,
          to: [clientEmail],
          reply_to: businessEmail || fromEmail,
          subject: emailData.subject,
          html: htmlBody,
        }),
      });
      const sentData = await sent.json();
      if (!sent.ok) {
        throw new Error(sentData?.message || 'Resend email delivery failed');
      }
      return new Response(JSON.stringify({ success: true, data: { ...emailData, provider: 'resend', id: sentData.id, sent: true } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (sendgridApiKey && fromEmail) {
      const sent = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: clientEmail, name: clientName }] }],
          from: { email: fromEmail, name: businessName || "Bill'em Invoice" },
          reply_to: businessEmail ? { email: businessEmail } : undefined,
          subject: emailData.subject,
          content: [{ type: 'text/html', value: htmlBody }],
        }),
      });
      if (!sent.ok) {
        throw new Error((await sent.text()) || 'SendGrid email delivery failed');
      }
      return new Response(JSON.stringify({ success: true, data: { ...emailData, provider: 'sendgrid', sent: true } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Send invoice email error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to prepare invoice email' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

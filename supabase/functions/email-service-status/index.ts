import { corsHeaders } from '../_shared/cors.ts';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const resendConfigured = Boolean(Deno.env.get('RESEND_API_KEY'));
    const sendgridConfigured = Boolean(Deno.env.get('SENDGRID_API_KEY'));
    const fromEmail = Deno.env.get('INVOICE_FROM_EMAIL') || '';

    return json({
      success: true,
      data: {
        resendConfigured,
        sendgridConfigured,
        fromEmail,
        connected: resendConfigured || sendgridConfigured,
        provider: resendConfigured ? 'Resend' : sendgridConfigured ? 'SendGrid' : 'None',
      },
    });
  } catch (error: any) {
    return json({ success: false, error: error.message || 'Could not read email service status' }, 500);
  }
});

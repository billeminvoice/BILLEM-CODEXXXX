import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { PAYMENT_BASE_URL } from '@/constants/config';
import type { Invoice, BusinessProfile, AppSettings } from '@/types';

export interface PaymentLinkRequest {
  invoice: Invoice;
  profile: BusinessProfile | null;
  settings: AppSettings;
}

const parseFunctionError = async (error: unknown, fallback: string) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const text = await error.context?.text();
      const parsed = JSON.parse(text || '{}');
      return parsed.error || text || fallback;
    } catch {
      return error.message || fallback;
    }
  }

  return error instanceof Error ? error.message : fallback;
};

export const paymentService = {
  buildFallbackPaymentLink: (invoiceId: string) =>
    `${PAYMENT_BASE_URL.replace(/\/$/, '')}/pay/${encodeURIComponent(invoiceId)}`,

  createInvoicePaymentLink: async ({
    invoice,
    profile,
    settings,
  }: PaymentLinkRequest): Promise<string> => {
    const fallback = paymentService.buildFallbackPaymentLink(invoice.id);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('create-invoice-payment', {
        body: {
          invoice: {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            total: invoice.total,
            currency: invoice.currency,
            clientEmail: invoice.clientEmail,
            clientName: invoice.clientName,
            lineItems: invoice.lineItems,
            paymentLink: fallback,
          },
          business: {
            name: profile?.businessName || profile?.ownerName || "Bill'em Invoice",
            email: profile?.email || '',
          },
          gateway: settings.defaultGateway || 'stripe',
          platformFeePercent: Number(settings.platformFeePercent) || 0,
          instantPayoutsEnabled: settings.instantPayoutsEnabled,
        },
      });

      if (error) throw new Error(await parseFunctionError(error, 'Could not create payment link'));
      return data?.data?.url || fallback;
    } catch {
      return fallback;
    }
  },

  configureGateway: async (
    gatewayId: string,
    credentials: Record<string, string>
  ): Promise<{ connected: boolean; mode: 'backend' | 'local' }> => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('configure-payment-gateway', {
        body: { gatewayId, credentials },
      });
      if (error) throw new Error(await parseFunctionError(error, 'Gateway setup failed'));
      return { connected: !!data?.success, mode: 'backend' };
    } catch {
      return { connected: true, mode: 'local' };
    }
  },
};

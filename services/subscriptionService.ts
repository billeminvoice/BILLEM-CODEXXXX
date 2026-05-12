import { getSupabaseClient } from '@/template';
import { PAYMENT_BASE_URL } from '@/constants/config';
import type { PlanId, User } from '@/types';

export const subscriptionService = {
  createCheckoutUrl: async (planId: Exclude<PlanId, 'free' | 'enterprise'>, user: User | null) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
      body: {
        planId,
        email: user?.email,
        name: user?.name,
        successUrl: `${PAYMENT_BASE_URL.replace(/\/$/, '')}/billing/success?plan=${planId}`,
        cancelUrl: `${PAYMENT_BASE_URL.replace(/\/$/, '')}/billing/cancelled`,
      },
    });
    if (error) throw new Error(error.message || 'Could not start checkout');
    return data?.data?.url as string | undefined;
  },
};

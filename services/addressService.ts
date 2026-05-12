import { getSupabaseClient } from '@/template';

export interface AddressSuggestion {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export const addressService = {
  autocomplete: async (query: string): Promise<AddressSuggestion[]> => {
    if (!query.trim() || query.trim().length < 3) return [];

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('address-autocomplete', {
        body: { query: query.trim() },
      });
      if (error) return [];
      return Array.isArray(data?.data) ? data.data : [];
    } catch {
      return [];
    }
  },
};

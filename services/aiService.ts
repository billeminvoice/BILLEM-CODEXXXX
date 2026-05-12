import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import type { LineItem } from '@/types';

export interface AIExtractionResult {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  lineItems: Omit<LineItem, 'id' | 'amount'>[];
  subtotal: number;
  taxRate: number;
  discountValue: number;
  discountType: 'percent' | 'fixed';
  notes: string;
  dueDate: string;
  issueDate: string;
  invoiceNumber: string;
  currency: string;
  confidence: number;
}

async function uriToBase64(uri: string): Promise<string> {
  // Read as base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  // Detect type by extension
  const lower = uri.toLowerCase();
  let mimeType = 'image/jpeg';
  if (lower.includes('.png')) mimeType = 'image/png';
  else if (lower.includes('.webp')) mimeType = 'image/webp';
  else if (lower.includes('.gif')) mimeType = 'image/gif';
  else if (lower.includes('.pdf')) mimeType = 'application/pdf';
  return `data:${mimeType};base64,${base64}`;
}

export const aiService = {
  extractFromImage: async (imageUri: string): Promise<AIExtractionResult> => {
    const supabase = getSupabaseClient();

    // Convert local file URI to base64 data URL
    const imageBase64 = await uriToBase64(imageUri);

    const { data, error } = await supabase.functions.invoke('ai-extract-invoice', {
      body: { imageBase64 },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const textContent = await error.context?.text();
          const parsed = JSON.parse(textContent || '{}');
          errorMessage = parsed.error || textContent || error.message;
        } catch {
          errorMessage = error.message || 'AI extraction failed';
        }
      }
      throw new Error(errorMessage);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'AI extraction returned no data');
    }

    return data.data as AIExtractionResult;
  },

  extractFromDataUrl: async (dataUrl: string): Promise<AIExtractionResult> => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.functions.invoke('ai-extract-invoice', {
      body: { imageBase64: dataUrl },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const textContent = await error.context?.text();
          const parsed = JSON.parse(textContent || '{}');
          errorMessage = parsed.error || textContent || error.message;
        } catch {
          errorMessage = error.message || 'AI extraction failed';
        }
      }
      throw new Error(errorMessage);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'AI extraction returned no data');
    }

    return data.data as AIExtractionResult;
  },
};

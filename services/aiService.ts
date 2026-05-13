import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
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
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Could not read selected file.');
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to convert file for AI scan.'));
      reader.readAsDataURL(blob);
    });
    if (!dataUrl.startsWith('data:')) throw new Error('Invalid file format.');
    return dataUrl;
  }

  const lower = uri.toLowerCase();
  if (lower.includes('.pdf')) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:application/pdf;base64,${base64}`;
  }

  // Normalize all images to JPEG to avoid format incompatibilities (HEIC/WEBP/etc)
  const normalized = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.92,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  const base64 = normalized.base64 || '';
  const mimeType = 'image/jpeg';
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
    const normalized = dataUrl.startsWith('data:') ? dataUrl : `data:image/png;base64,${dataUrl}`;

    const { data, error } = await supabase.functions.invoke('ai-extract-invoice', {
      body: { imageBase64: normalized },
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

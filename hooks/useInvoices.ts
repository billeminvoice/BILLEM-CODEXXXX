import { useContext } from 'react';
import { InvoiceContext } from '@/contexts/InvoiceContext';

export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoices must be used within InvoiceProvider');
  return ctx;
}

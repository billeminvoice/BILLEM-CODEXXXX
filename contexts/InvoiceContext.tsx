import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { invoiceService } from '@/services/invoiceService';
import type { Invoice } from '@/types';

interface InvoiceContextType {
  invoices: Invoice[];
  isLoading: boolean;
  loadInvoices: () => Promise<void>;
  createInvoice: (data: Partial<Invoice>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  markPaid: (id: string) => Promise<void>;
  markSent: (id: string) => Promise<void>;
  stats: { revenue: number; unpaid: number; overdue: number; totalInvoices: number; thisMonthCount: number };
}

export const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

const DEFAULT_STATS = { revenue: 0, unpaid: 0, overdue: 0, totalInvoices: 0, thisMonthCount: 0 };

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(DEFAULT_STATS);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    const all = await invoiceService.getAll();
    const s = await invoiceService.getStats();
    setInvoices(all);
    setStats(s);
    setIsLoading(false);
  }, []);

  const createInvoice = async (data: Partial<Invoice>) => {
    const inv = await invoiceService.create(data);
    await loadInvoices();
    return inv;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const inv = await invoiceService.update(id, updates);
    await loadInvoices();
    return inv;
  };

  const deleteInvoice = async (id: string) => {
    await invoiceService.delete(id);
    await loadInvoices();
  };

  const markPaid = async (id: string) => {
    await invoiceService.markPaid(id);
    await loadInvoices();
  };

  const markSent = async (id: string) => {
    await invoiceService.markSent(id);
    await loadInvoices();
  };

  return (
    <InvoiceContext.Provider value={{ invoices, isLoading, loadInvoices, createInvoice, updateInvoice, deleteInvoice, markPaid, markSent, stats }}>
      {children}
    </InvoiceContext.Provider>
  );
}

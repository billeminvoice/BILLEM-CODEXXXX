import { storage } from './storageService';
import { STORAGE_KEYS } from '@/constants/config';
import type { Client } from '@/types';

const generateId = () => `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const clientService = {
  getAll: async (): Promise<Client[]> => {
    return (await storage.get<Client[]>(STORAGE_KEYS.CLIENTS)) || [];
  },

  getById: async (id: string): Promise<Client | null> => {
    const all = await clientService.getAll();
    return all.find((c) => c.id === id) || null;
  },

  create: async (data: Partial<Client>): Promise<Client> => {
    const all = await clientService.getAll();
    const client: Client = {
      id: generateId(),
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      company: data.company || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: data.zipCode || '',
      country: data.country || 'United States',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      totalInvoiced: 0,
      totalPaid: 0,
    };
    all.unshift(client);
    await storage.set(STORAGE_KEYS.CLIENTS, all);
    return client;
  },

  update: async (id: string, updates: Partial<Client>): Promise<Client> => {
    const all = await clientService.getAll();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Client not found');
    all[idx] = { ...all[idx], ...updates };
    await storage.set(STORAGE_KEYS.CLIENTS, all);
    return all[idx];
  },

  delete: async (id: string): Promise<void> => {
    const all = await clientService.getAll();
    await storage.set(STORAGE_KEYS.CLIENTS, all.filter((c) => c.id !== id));
  },
};

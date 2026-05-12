import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { clientService } from '@/services/clientService';
import type { Client } from '@/types';

interface ClientContextType {
  clients: Client[];
  isLoading: boolean;
  loadClients: () => Promise<void>;
  createClient: (data: Partial<Client>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
}

export const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    const all = await clientService.getAll();
    setClients(all);
    setIsLoading(false);
  }, []);

  const createClient = async (data: Partial<Client>) => {
    const c = await clientService.create(data);
    await loadClients();
    return c;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const c = await clientService.update(id, updates);
    await loadClients();
    return c;
  };

  const deleteClient = async (id: string) => {
    await clientService.delete(id);
    await loadClients();
  };

  return (
    <ClientContext.Provider value={{ clients, isLoading, loadClients, createClient, updateClient, deleteClient }}>
      {children}
    </ClientContext.Provider>
  );
}

import { useContext } from 'react';
import { ClientContext } from '@/contexts/ClientContext';

export function useClients() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error('useClients must be used within ClientProvider');
  return ctx;
}

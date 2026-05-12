import { storage } from './storageService';
import { STORAGE_KEYS } from '@/constants/config';
import type { User, AccountType, PlanId } from '@/types';

const MOCK_USERS_KEY = '@billem_mock_users';

export const authService = {
  signUp: async (email: string, password: string, name: string): Promise<User> => {
    const users = (await storage.get<Record<string, { password: string; user: User }>>(MOCK_USERS_KEY)) || {};
    if (users[email]) throw new Error('An account with this email already exists.');
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      accountType: 'business',
      planId: 'free',
      createdAt: new Date().toISOString(),
    };
    users[email] = { password, user };
    await storage.set(MOCK_USERS_KEY, users);
    await storage.set(STORAGE_KEYS.AUTH_USER, user);
    return user;
  },

  signIn: async (email: string, password: string): Promise<User> => {
    const users = (await storage.get<Record<string, { password: string; user: User }>>(MOCK_USERS_KEY)) || {};
    const record = users[email];
    if (!record) throw new Error('No account found with this email.');
    if (record.password !== password) throw new Error('Incorrect password. Please try again.');
    await storage.set(STORAGE_KEYS.AUTH_USER, record.user);
    return record.user;
  },

  signOut: async (): Promise<void> => {
    await storage.remove(STORAGE_KEYS.AUTH_USER);
  },

  getCurrentUser: async (): Promise<User | null> => {
    return storage.get<User>(STORAGE_KEYS.AUTH_USER);
  },

  updateUser: async (updates: Partial<User>): Promise<User> => {
    const current = await storage.get<User>(STORAGE_KEYS.AUTH_USER);
    if (!current) throw new Error('Not authenticated');
    const updated = { ...current, ...updates };
    await storage.set(STORAGE_KEYS.AUTH_USER, updated);
    const users = (await storage.get<Record<string, { password: string; user: User }>>(MOCK_USERS_KEY)) || {};
    if (users[current.email]) {
      users[current.email].user = updated;
      await storage.set(MOCK_USERS_KEY, users);
    }
    return updated;
  },

  updatePlan: async (planId: PlanId): Promise<User> => {
    return authService.updateUser({ planId });
  },
};

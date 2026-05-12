import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/authService';
import { storage } from '@/services/storageService';
import { STORAGE_KEYS } from '@/constants/config';
import type { User, BusinessProfile, AppSettings } from '@/types';

interface AuthContextType {
  user: User | null;
  businessProfile: BusinessProfile | null;
  settings: AppSettings;
  isLoading: boolean;
  onboardingDone: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveBusinessProfile: (profile: BusinessProfile) => Promise<void>;
  updateSettings: (s: Partial<AppSettings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  defaultGateway: 'stripe',
  platformFeePercent: '0',
  instantPayoutsEnabled: false,
  emailNotifications: true,
  pushNotifications: true,
  invoiceReminders: true,
  darkMode: false,
  weeklyDigest: true,
  marketingEmails: false,
  paymentAlerts: true,
  overdueAlerts: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    (async () => {
      const [u, bp, s, od] = await Promise.all([
        authService.getCurrentUser(),
        storage.get<BusinessProfile>(STORAGE_KEYS.BUSINESS_PROFILE),
        storage.get<AppSettings>(STORAGE_KEYS.SETTINGS),
        storage.get<boolean>(STORAGE_KEYS.ONBOARDING_DONE),
      ]);
      setUser(u);
      setBusinessProfile(bp);
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s });
      setOnboardingDone(!!od);
      setIsLoading(false);
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const u = await authService.signIn(email, password);
    const bp = await storage.get<BusinessProfile>(STORAGE_KEYS.BUSINESS_PROFILE);
    const od = await storage.get<boolean>(STORAGE_KEYS.ONBOARDING_DONE);
    setUser(u);
    setBusinessProfile(bp);
    setOnboardingDone(!!od);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const u = await authService.signUp(email, password, name);
    setUser(u);
    setOnboardingDone(false);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setOnboardingDone(false);
  };

  const saveBusinessProfile = async (profile: BusinessProfile) => {
    await storage.set(STORAGE_KEYS.BUSINESS_PROFILE, profile);
    setBusinessProfile(profile);
  };

  const updateSettings = async (s: Partial<AppSettings>) => {
    const updated = { ...settings, ...s };
    await storage.set(STORAGE_KEYS.SETTINGS, updated);
    setSettings(updated);
  };

  const completeOnboarding = async () => {
    await storage.set(STORAGE_KEYS.ONBOARDING_DONE, true);
    setOnboardingDone(true);
  };

  const refreshUser = async () => {
    const u = await authService.getCurrentUser();
    setUser(u);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        businessProfile,
        settings,
        isLoading,
        onboardingDone,
        signIn,
        signUp,
        signOut,
        saveBusinessProfile,
        updateSettings,
        completeOnboarding,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

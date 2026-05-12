export type AccountType = 'business' | 'personal';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
export type PlanId = 'free' | 'pro' | 'business' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  accountType: AccountType;
  planId: PlanId;
  createdAt: string;
}

export interface BusinessProfile {
  // Identity
  businessName: string;
  ownerName: string;
  accountType: AccountType;

  // Contact
  email: string;
  phone: string;
  website: string;

  // Address
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;

  // Tax
  taxId: string;
  taxType: string;
  defaultTaxRate: string;
  taxInclusive: boolean;

  // Preferences
  currency: string;
  paymentTerms: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultNotes: string;

  // Branding
  accentColor: string;
  logoUri: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  notes: string;
  createdAt: string;
  totalInvoiced: number;
  totalPaid: number;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;

  issueDate: string;
  dueDate: string;

  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
  total: number;

  notes: string;
  terms: string;
  currency: string;

  paymentLink: string;
  paidAt: string | null;

  createdAt: string;
  updatedAt: string;
  sentAt: string | null;

  isRecurring: boolean;
  recurringInterval: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;
}

export interface GatewayConnection {
  gatewayId: string;
  connected: boolean;
  credentials: Record<string, string>;
  isDefault: boolean;
  connectedAt: string | null;
}

export interface AppSettings {
  defaultGateway: string;
  platformFeePercent: string;
  instantPayoutsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  invoiceReminders: boolean;
  darkMode: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  paymentAlerts: boolean;
  overdueAlerts: boolean;
}

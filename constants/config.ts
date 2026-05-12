export const APP_NAME = "Bill'em Invoice";
export const APP_VERSION = '1.0.0';

export const STORAGE_KEYS = {
  AUTH_USER: '@billem_auth_user',
  BUSINESS_PROFILE: '@billem_business_profile',
  ONBOARDING_DONE: '@billem_onboarding_done',
  INVOICES: '@billem_invoices',
  CLIENTS: '@billem_clients',
  SETTINGS: '@billem_settings',
  GATEWAYS: '@billem_gateways',
  AI_SCAN_COUNT: '@billem_ai_scan_count',
  SUBSCRIPTION: '@billem_subscription',
};

export const PAYMENT_BASE_URL =
  process.env.EXPO_PUBLIC_PAYMENT_BASE_URL || 'https://billem.app';

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Free',
    invoicesPerMonth: 2,
    aiScansPerMonth: 1,
    processingFee: '2.9% + $0.30',
    customBranding: false,
    analytics: false,
    features: ['2 invoices/month', '1 AI scan/month', '2.9% + $0.30 fee', 'Email invoices', 'Basic templates'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9,
    priceLabel: '$9/mo',
    invoicesPerMonth: -1,
    aiScansPerMonth: -1,
    processingFee: '2.9% + $0.30',
    customBranding: false,
    analytics: false,
    features: ['Unlimited invoices', 'Unlimited AI scans', '2.9% + $0.30 fee', 'Email invoices', 'All templates', 'Recurring invoices'],
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 39.99,
    priceLabel: '$39.99/mo',
    invoicesPerMonth: -1,
    aiScansPerMonth: -1,
    processingFee: '2.9% + $0.30',
    customBranding: true,
    analytics: true,
    features: ['Unlimited invoices', 'Unlimited AI scans', 'Custom branding', 'Advanced analytics', 'Priority support', 'Recurring invoices', 'Multi-gateway support'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: -1,
    priceLabel: 'Contact Us',
    invoicesPerMonth: -1,
    aiScansPerMonth: -1,
    processingFee: 'Custom rates',
    customBranding: true,
    analytics: true,
    features: ['Everything in Business', 'Custom processing rates', 'Dedicated support', 'Custom integrations', 'SLA guarantee', 'Team accounts'],
  },
};

export const PAYMENT_GATEWAYS = [
  {
    id: 'stripe',
    name: 'Stripe',
    logo: '💳',
    description: 'Accept cards, ACH, Apple Pay & more',
    color: '#635BFF',
    fields: ['Publishable Key', 'Secret Key', 'Webhook Secret'],
    features: ['Cards', 'ACH', 'Apple Pay', 'Google Pay', 'Subscriptions'],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    logo: '🅿️',
    description: 'PayPal, Venmo & credit cards worldwide',
    color: '#003087',
    fields: ['Client ID', 'Client Secret', 'Merchant ID'],
    features: ['PayPal', 'Venmo', 'Credit Cards', 'Pay Later'],
  },
];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'MXN', 'BRL', 'INR'];
export const PAYMENT_TERMS = ['Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90'];
export const TAX_TYPES = ['Sales Tax', 'VAT', 'GST', 'HST', 'PST'];

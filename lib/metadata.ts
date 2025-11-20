import type { Metadata } from "next";

export const landingMetadata: Metadata = {
  title: "BS Convert - AI-Powered Bank Statement to CSV/Excel Converter",
  description: "Convert your bank statements from PDF to CSV/Excel/FEC instantly using AI-powered extraction. Compatible with Sage, Cegid, and all French accounting software. Save 10+ hours per month.",
  keywords: [
    "bank statement converter",
    "PDF to CSV",
    "PDF to Excel",
    "FEC format",
    "accounting automation",
    "bank statement OCR",
    "Sage integration",
    "Cegid integration",
    "QuickBooks",
    "Xero"
  ],
  openGraph: {
    title: "BS Convert - AI Bank Statement Converter",
    description: "Convert bank statements to CSV/Excel/FEC instantly with AI. Save 10+ hours per month on accounting.",
    type: "website",
    url: "https://bsconvert.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "BS Convert - AI Bank Statement Converter",
    description: "Convert bank statements to CSV/Excel/FEC instantly with AI",
  },
};

export const dashboardMetadata: Metadata = {
  title: "Dashboard - BS Convert",
  description: "Manage your bank statement conversions, track credits usage, and view conversion history.",
  robots: "noindex, nofollow", // Private dashboard
};

export const convertMetadata: Metadata = {
  title: "Convert Statement - BS Convert",
  description: "Upload and convert your bank statement PDF to CSV, Excel, or FEC format with AI-powered extraction.",
  robots: "noindex, nofollow",
};

export const historyMetadata: Metadata = {
  title: "Conversion History - BS Convert",
  description: "View all your past bank statement conversions with detailed transaction data and export options.",
  robots: "noindex, nofollow",
};

export const settingsMetadata: Metadata = {
  title: "Settings - BS Convert",
  description: "Manage your account settings, subscription, and preferences.",
  robots: "noindex, nofollow",
};

export const billingMetadata: Metadata = {
  title: "Billing & Subscription - BS Convert",
  description: "Manage your subscription plan, view invoices, and update payment methods.",
  robots: "noindex, nofollow",
};

export const privacyMetadata: Metadata = {
  title: "Privacy Policy - BS Convert",
  description: "BS Convert's privacy policy: how we collect, use, and protect your bank statement data. GDPR compliant.",
};

export const termsMetadata: Metadata = {
  title: "Terms of Service - BS Convert",
  description: "BS Convert's terms of service and usage conditions for our bank statement conversion platform.",
};

export const pricingMetadata: Metadata = {
  title: "Pricing Plans - BS Convert | From $19.99/month",
  description: "Transparent pricing for bank statement conversion: Starter ($19.99), Professional ($49.99), Enterprise ($99.99). Save up to 17% with annual billing.",
};

export const blogMetadata: Metadata = {
  title: "Resources & Blog - BS Convert | Accounting Automation Guides",
  description: "Expert guides on bank statement conversion, OCR automation, accounting software integration, and financial data management.",
};

// Helper pour générer des metadata dynamiques
export function generateBlogPostMetadata(
  title: string,
  description: string,
  publishedAt: string,
  keywords: string[]
): Metadata {
  return {
    title: `${title} - BS Convert Blog`,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: publishedAt,
      url: `https://bsconvert.com/blog`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

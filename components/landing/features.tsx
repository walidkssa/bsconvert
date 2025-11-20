import {
  Zap,
  FileCheck,
  Shield,
  Sparkles,
  Globe,
  Clock,
} from "lucide-react";
import React from "react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Extraction",
    description:
      "Grok AI extracts transactions with 99% accuracy from any bank statement format, even handwritten notes.",
  },
  {
    icon: Globe,
    title: "Universal Bank Support",
    description:
      "Works with 500+ banks worldwide. Supports multiple languages, currencies, and date formats automatically.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Convert 100-page PDF statements in under 30 seconds. Batch process multiple files simultaneously.",
  },
  {
    icon: FileCheck,
    title: "Multiple Export Formats",
    description:
      "Export to FEC, Sage 100c, Cegid Loop, QuickBooks, Xero, Excel, or CSV. One click, any format you need.",
  },
  {
    icon: FileCheck,
    title: "Automatic Validation",
    description:
      "Built-in validation checks balances, detects duplicates, and flags inconsistencies before export.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description:
      "AES-256 encryption, SOC 2 Type II certified. Your data is encrypted at rest and in transit.",
  },
];

const Features = () => {
  return (
    <div id="features" className="w-full py-12 xs:py-20 px-6">
      <div className="max-w-screen-xl mx-auto">
        <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight text-center">
          Everything You Need to Streamline Accounting
        </h2>
        <p className="mt-4 text-center text-muted-foreground text-lg max-w-2xl mx-auto">
          Built for accountants, by accountants. Trusted by thousands of professionals worldwide.
        </p>
        <div className="w-full mt-10 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col bg-background border rounded-xl py-6 px-5 hover:border-primary/50 transition-colors"
            >
              <div className="mb-3 h-10 w-10 flex items-center justify-center bg-primary/10 rounded-full">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-lg font-semibold">{feature.title}</span>
              <p className="mt-1 text-foreground/80 text-[15px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;

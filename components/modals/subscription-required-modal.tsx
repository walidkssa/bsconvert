"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CircleCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import { getStripePriceId } from "@/lib/stripe-config";
import type { PlanTier } from "@/lib/stripe-config";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  {
    name: "Starter",
    monthlyPrice: 19.99,
    yearlyPrice: 180,
    monthlyPages: 500,
    yearlyPages: 6000,
    description: "Perfect for small businesses and freelancers.",
    features: [
      { title: "Most powerful OCR AI model on the market" },
      { title: "All bank formats supported" },
      { title: "All export formats (FEC, Sage, Cegid, QB, Xero)" },
      { title: "Email support" },
    ],
  },
  {
    name: "Professional",
    monthlyPrice: 49.99,
    yearlyPrice: 390,
    monthlyPages: 1500,
    yearlyPages: 18000,
    isRecommended: true,
    description: "For accounting professionals managing multiple clients.",
    features: [
      { title: "Most powerful OCR AI model on the market" },
      { title: "All bank formats supported" },
      { title: "All export formats (FEC, Sage, Cegid, QB, Xero)" },
      { title: "Priority support (< 24h response)" },
    ],
    isPopular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: 99.99,
    yearlyPrice: 890,
    monthlyPages: 10000,
    yearlyPages: 120000,
    description: "For large organizations with high-volume needs.",
    features: [
      { title: "Most powerful OCR AI model on the market" },
      { title: "All bank formats supported" },
      { title: "All export formats (FEC, Sage, Cegid, QB, Xero)" },
      { title: "Priority support (< 24h response)" },
    ],
  },
];

export default function SubscriptionRequiredModal({
  isOpen,
  onClose,
}: SubscriptionRequiredModalProps) {
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (planName: string, billingCycle: "monthly" | "yearly") => {
    setIsLoading(planName);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/auth/signup';
        return;
      }

      // Get the Stripe Price ID
      const planTier = planName.toLowerCase() as PlanTier;
      const priceId = getStripePriceId(planTier, billingCycle);

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          planTier,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details
          ? `${data.error}: ${data.details}${data.stripeCode ? ` (${data.stripeCode})` : ''}`
          : data.error || 'Failed to create checkout session';
        throw new Error(errorMsg);
      }

      // Redirect to Stripe Checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout process');
      setIsLoading(null);
    }
  };

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const totalMonthlyYearly = monthlyPrice * 12;
    const savings = ((totalMonthlyYearly - yearlyPrice) / totalMonthlyYearly) * 100;
    return Math.round(savings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <VisuallyHidden>
          <DialogTitle>Choose Your Subscription Plan</DialogTitle>
        </VisuallyHidden>
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            {/* Warning Banner */}
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-amber-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-amber-900">Subscription Required</p>
                  <p className="text-sm text-amber-700">
                    To convert files, you need an active subscription. Choose a plan below to get started.
                  </p>
                </div>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-4">
              Choose Your Plan
            </h1>
            <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Save up to 17% with annual billing.
            </p>

            <Tabs
              value={selectedBillingPeriod}
              onValueChange={(value) => setSelectedBillingPeriod(value as "monthly" | "yearly")}
              className="flex justify-center mb-8"
            >
              <TabsList className="h-11 px-1.5 rounded-full bg-primary/5">
                <TabsTrigger value="monthly" className="py-1.5 rounded-full">
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="yearly" className="py-1.5 rounded-full">
                  Yearly
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-3 items-stretch gap-6">
              {plans.map((plan) => {
                const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice);
                const displayPrice = selectedBillingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
                const displayPages = selectedBillingPeriod === "monthly" ? plan.monthlyPages : plan.yearlyPages;
                const billingText = selectedBillingPeriod === "monthly" ? "/month" : "/year";

                return (
                  <div
                    key={plan.name}
                    className={cn("relative border rounded-xl p-6 bg-background/50 flex flex-col", {
                      "border-[2px] border-primary bg-background scale-105 shadow-xl": plan.isPopular,
                    })}
                  >
                    {plan.isPopular && (
                      <Badge className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-foreground text-background">
                        Most Popular
                      </Badge>
                    )}
                    {selectedBillingPeriod === "yearly" && (
                      <Badge className="absolute top-4 right-4 bg-green-600 text-white">
                        Save {savings}%
                      </Badge>
                    )}
                    <h3 className="text-lg font-medium">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${displayPrice}</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        {billingText}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {displayPages.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} pages {selectedBillingPeriod === "monthly" ? "per month" : "per year"}
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {plan.description}
                    </p>

                    <Button
                      variant={plan.isPopular ? "default" : "outline"}
                      size="lg"
                      className="w-full mt-6"
                      onClick={() => handleSubscribe(plan.name, selectedBillingPeriod)}
                      disabled={isLoading === plan.name}
                    >
                      {isLoading === plan.name ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        "Subscribe Now"
                      )}
                    </Button>
                    <Separator className="my-6" />
                    <ul className="space-y-2 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature.title} className="flex items-start gap-1.5">
                          <CircleCheck className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                          <span className="text-xs">{feature.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

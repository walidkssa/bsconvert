"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CircleCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { getStripePriceId } from "@/lib/stripe-config";
import type { PlanTier } from "@/lib/stripe-config";

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

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  const [selectedBillingPeriod, setSelectedBillingPeriod] = React.useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const router = useRouter();

  const handleSubscribe = async (planName: string, billingCycle: "monthly" | "yearly") => {
    setIsLoading(planName);

    try {
      // Check if user is authenticated
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to signup if not authenticated
        router.push('/auth/signup');
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
        throw new Error(data.error || 'Failed to create checkout session');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Choose the plan that fits your needs. Save up to 17% with annual billing.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={selectedBillingPeriod}
          onValueChange={(value) => setSelectedBillingPeriod(value as "monthly" | "yearly")}
          className="mt-4 flex justify-center"
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

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 items-stretch gap-4">
          {plans.map((plan) => {
            const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice);
            const displayPrice = selectedBillingPeriod === "monthly"
              ? plan.monthlyPrice
              : plan.yearlyPrice;
            const displayPages = selectedBillingPeriod === "monthly" ? plan.monthlyPages : plan.yearlyPages;
            const billingText = selectedBillingPeriod === "monthly" ? "/month" : "/year";

            return (
              <div
                key={plan.name}
                className={cn("relative border rounded-lg p-4 bg-background flex flex-col", {
                  "border-2 border-primary bg-accent/10": plan.isPopular,
                })}
              >
                {plan.isPopular && (
                  <Badge className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-foreground text-background">
                    Most Popular
                  </Badge>
                )}
                {selectedBillingPeriod === "yearly" && (
                  <Badge className="absolute top-2 right-2 bg-green-600 text-white text-xs">
                    Save {savings}%
                  </Badge>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${displayPrice.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">
                    {billingText}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-primary">
                  {displayPages.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} pages {selectedBillingPeriod === "monthly" ? "per month" : "per year"}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {plan.description}
                </p>

                <Button
                  variant={plan.isPopular ? "default" : "outline"}
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => handleSubscribe(plan.name, selectedBillingPeriod)}
                  disabled={isLoading === plan.name}
                >
                  {isLoading === plan.name ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
                <Separator className="my-4" />
                <ul className="space-y-2 flex-1 text-sm">
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
      </DialogContent>
    </Dialog>
  );
}

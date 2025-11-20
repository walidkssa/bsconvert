"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    buttonText: "Get Started",
    buttonLink: "/auth/signup",
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
    buttonText: "Start Professional",
    buttonLink: "/auth/signup",
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
    buttonText: "Contact Sales",
    buttonLink: "/auth/signup",
  },
];

const Pricing = () => {
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRequired = searchParams.get('required') === 'true';

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
    <div
      id="pricing"
      className="flex flex-col items-center justify-center py-12 xs:py-20 px-6"
    >
      <div className="max-w-screen-xl w-full">
        {isRequired && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-2xl mx-auto">
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
                  You need an active subscription to access the dashboard and convert files.
                </p>
              </div>
            </div>
          </div>
        )}
        <h1 className="text-3xl xs:text-4xl md:text-5xl font-bold text-center tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 text-center text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose the plan that fits your needs. Save up to 17% with annual billing.
        </p>
        <Tabs
          value={selectedBillingPeriod}
          onValueChange={(value) => setSelectedBillingPeriod(value as "monthly" | "yearly")}
          className="mt-8 flex justify-center"
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
        <div className="mt-12 max-w-screen-lg mx-auto grid grid-cols-1 lg:grid-cols-3 items-stretch gap-8">
          {plans.map((plan) => {
            const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice);
            // Afficher le prix correspondant à la période sélectionnée
            const displayPrice = selectedBillingPeriod === "monthly"
              ? plan.monthlyPrice
              : plan.yearlyPrice;
            const displayPages = selectedBillingPeriod === "monthly" ? plan.monthlyPages : plan.yearlyPages;
            const billingText = selectedBillingPeriod === "monthly" ? "/month" : "/year";

            return (
              <div
                key={plan.name}
                className={cn("relative border rounded-xl p-6 bg-background/50 flex flex-col", {
                  "border-[2px] border-primary bg-background py-10 scale-105 shadow-xl": plan.isPopular,
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
                  <span className="text-4xl font-bold">${displayPrice.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {billingText}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-primary">
                  {displayPages.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} pages {selectedBillingPeriod === "monthly" ? "per month" : "per year"}
                </p>
                <p className="mt-4 font-medium text-muted-foreground">
                  {plan.description}
                </p>

                <Button
                  variant={plan.isPopular ? "default" : "outline"}
                  size="lg"
                  className="w-full mt-6 text-base"
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
                    plan.buttonText
                  )}
                </Button>
                <Separator className="my-8" />
                <ul className="space-y-2 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.title} className="flex items-start gap-1.5">
                      <CircleCheck className="h-4 w-4 mt-1 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Pricing;

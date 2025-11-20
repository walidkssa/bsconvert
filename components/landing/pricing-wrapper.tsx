"use client";

import { Suspense } from "react";
import Pricing from "./pricing";

// Loading fallback for Pricing component
function PricingFallback() {
  return (
    <div id="pricing" className="flex flex-col items-center justify-center py-12 xs:py-20 px-6">
      <div className="max-w-screen-xl w-full">
        <h1 className="text-3xl xs:text-4xl md:text-5xl font-bold text-center tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 text-center text-muted-foreground text-lg max-w-2xl mx-auto">
          Loading pricing options...
        </p>
        <div className="mt-12 max-w-screen-lg mx-auto grid grid-cols-1 lg:grid-cols-3 items-stretch gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-xl p-6 bg-background/50 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-10 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3 mb-6"></div>
              <div className="h-10 bg-muted rounded w-full mb-8"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Wrapper component that wraps Pricing in Suspense
export default function PricingWrapper() {
  return (
    <Suspense fallback={<PricingFallback />}>
      <Pricing />
    </Suspense>
  );
}

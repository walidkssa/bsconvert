'use client';

import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function BillingPage() {
  const {
    profile,
    loading,
    hasActiveSubscription,
    creditsRemaining,
    creditsUsed,
    creditsLimit,
    planTier,
    billingCycle,
  } = useUserProfile();

  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const router = useRouter();

  const handleManageBilling = async () => {
    setIsLoadingPortal(true);

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      alert(error instanceof Error ? error.message : 'Failed to open billing portal');
      setIsLoadingPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and billing information</p>
        </div>

        {/* No Subscription State */}
        {!hasActiveSubscription && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Subscription</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Subscribe to a plan to unlock powerful OCR conversion tools and start processing your files.
            </p>
            <Button
              size="lg"
              onClick={() => router.push('/pricing')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              View Plans
            </Button>
          </div>
        )}

        {/* Active Subscription */}
        {hasActiveSubscription && profile && (
          <div className="space-y-6">
            {/* Current Plan Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Current Plan</h2>
                <Badge className={getStatusColor(profile.subscription_status)}>
                  {profile.subscription_status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Plan</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{planTier}</p>
                  <p className="text-sm text-gray-600 capitalize mt-1">
                    Billed {billingCycle}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Monthly Credits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {creditsLimit.toLocaleString()} pages
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {creditsRemaining.toLocaleString()} remaining
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Current Period Start</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(profile.current_period_start)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Period End</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(profile.current_period_end)}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <Button
                onClick={handleManageBilling}
                disabled={isLoadingPortal}
                className="w-full md:w-auto"
              >
                {isLoadingPortal ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  'Manage Subscription'
                )}
              </Button>
            </div>

            {/* Usage Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Usage This Month</h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Pages Processed</span>
                    <span className="text-sm font-bold text-gray-900">
                      {creditsUsed.toLocaleString()} / {creditsLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${Math.min((creditsUsed / creditsLimit) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-medium text-gray-900">
                    {creditsRemaining.toLocaleString()} pages
                  </span>
                </div>
              </div>
            </div>

            {/* Billing Portal Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Manage Your Subscription</p>
                  <p className="text-sm text-blue-700">
                    Use the Stripe Customer Portal to update payment methods, view invoices, change plans, or cancel your subscription.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useUserProfile } from '@/lib/hooks/useUserProfile';
import Link from 'next/link';

export function CreditsWidget() {
  const {
    loading,
    creditsRemaining,
    creditsUsed,
    creditsLimit,
    planTier,
    hasActiveSubscription,
  } = useUserProfile();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-amber-600"
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
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              No Active Subscription
            </h3>
            <p className="text-sm text-amber-700 mb-3">
              Subscribe to a plan to start converting your files.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const usagePercentage = creditsLimit > 0 ? (creditsUsed / creditsLimit) * 100 : 0;
  const isLowCredits = creditsRemaining < creditsLimit * 0.2; // Less than 20%
  const isOutOfCredits = creditsRemaining === 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Credits This Month</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 capitalize">
          {planTier}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-3xl font-bold text-gray-900">
            {creditsRemaining.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">
            / {creditsLimit.toLocaleString()} pages
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full transition-all duration-300 rounded-full ${
              isOutOfCredits
                ? 'bg-red-500'
                : isLowCredits
                ? 'bg-amber-500'
                : 'bg-purple-600'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {creditsUsed.toLocaleString()} used
        </span>
        {isLowCredits && !isOutOfCredits && (
          <span className="text-amber-600 font-medium">Low credits</span>
        )}
        {isOutOfCredits && (
          <span className="text-red-600 font-medium">No credits left</span>
        )}
      </div>

      {isLowCredits && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            href="/dashboard/billing"
            className="block w-full text-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            {isOutOfCredits ? 'Upgrade to Continue' : 'Manage Plan'}
          </Link>
        </div>
      )}
    </div>
  );
}

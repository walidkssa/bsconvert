// @ts-nocheck
'use client';

import * as React from 'react';
import { CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { Badge } from '@/components/ui/badge';

export function CreditsBadge() {
  const [credits, setCredits] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCredits = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('credits_monthly_limit, credits_used_this_month, subscription_status')
          .eq('id', user.id)
          .single();

        if (profile && profile.subscription_status === 'active') {
          const remaining = (profile.credits_monthly_limit || 0) - (profile.credits_used_this_month || 0);
          setCredits(Math.max(0, remaining));
        }
      } catch (err) {
        console.error('Error fetching credits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    // Listen for conversion completion event
    const handleConversionComplete = () => {
      fetchCredits();
    };

    window.addEventListener('credits-updated', handleConversionComplete);
    return () => window.removeEventListener('credits-updated', handleConversionComplete);
  }, []);

  if (loading || credits === null) {
    return null;
  }

  const isLow = credits < 100;
  const isCritical = credits < 50;

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1.5 px-2.5 py-1 ${
        isCritical
          ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100'
          : isLow
          ? 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100'
          : 'border-primary/20 bg-primary/5'
      }`}
    >
      <CreditCard className="h-3.5 w-3.5" />
      <span className="font-mono text-xs font-semibold">
        {credits.toLocaleString()}
      </span>
      <span className={`text-[10px] ${
        isCritical || isLow ? 'opacity-75' : 'text-muted-foreground'
      }`}>
        pages
      </span>
    </Badge>
  );
}

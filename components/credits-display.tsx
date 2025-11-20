// @ts-nocheck
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard, TrendingDown, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CreditsDisplayProps {
  variant?: 'full' | 'compact';
  showUpgradeButton?: boolean;
}

export function CreditsDisplay({
  variant = 'full',
  showUpgradeButton = false
}: CreditsDisplayProps) {
  const [loading, setLoading] = React.useState(true);
  const [creditsData, setCreditsData] = React.useState<{
    remaining: number;
    limit: number;
    percentage: number;
    planTier: string;
    status: string;
  } | null>(null);

  React.useEffect(() => {
    const fetchCredits = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('credits_monthly_limit, credits_used_this_month, plan_tier, subscription_status')
          .eq('id', user.id)
          .single();

        if (profile) {
          const remaining = (profile.credits_monthly_limit || 0) - (profile.credits_used_this_month || 0);
          const limit = profile.credits_monthly_limit || 0;
          const percentage = limit > 0 ? (remaining / limit) * 100 : 0;

          setCreditsData({
            remaining: Math.max(0, remaining),
            limit,
            percentage: Math.max(0, Math.min(100, percentage)),
            planTier: profile.plan_tier || 'Aucun',
            status: profile.subscription_status || 'inactive',
          });
        }
      } catch (err) {
        console.error('Error fetching credits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!creditsData || creditsData.status !== 'active') {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">Aucun abonnement actif</p>
              <p className="text-xs text-amber-700">Souscrivez pour commencer à convertir</p>
            </div>
            {showUpgradeButton && (
              <Button size="sm" asChild>
                <Link href="/settings">S'abonner</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLow = creditsData.percentage < 20;
  const isMedium = creditsData.percentage >= 20 && creditsData.percentage < 50;

  if (variant === 'compact') {
    return (
      <Card className={isLow ? 'border-red-200 bg-red-50' : isMedium ? 'border-orange-200 bg-orange-50' : ''}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <CreditCard className={`h-4 w-4 ${isLow ? 'text-red-600' : isMedium ? 'text-orange-600' : 'text-primary'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono font-bold">
                  {creditsData.remaining.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {creditsData.limit.toLocaleString()} pages
                </span>
              </div>
              <Progress
                value={creditsData.percentage}
                className={`h-1.5 ${isLow ? 'bg-red-200' : isMedium ? 'bg-orange-200' : ''}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isLow ? 'border-red-200 bg-red-50' : isMedium ? 'border-orange-200 bg-orange-50' : 'border-primary/20'}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className={`h-5 w-5 ${isLow ? 'text-red-600' : isMedium ? 'text-orange-600' : 'text-primary'}`} />
              <h3 className="font-semibold">Crédits de conversion</h3>
            </div>
            <Badge variant={creditsData.status === 'active' ? 'default' : 'outline'}>
              {creditsData.planTier}
            </Badge>
          </div>

          {/* Credits Count */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-mono font-bold">
                {creditsData.remaining.toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground">
                / {creditsData.limit.toLocaleString()} pages
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress
                value={creditsData.percentage}
                className={`h-3 ${isLow ? 'bg-red-200' : isMedium ? 'bg-orange-200' : ''}`}
              />
              <p className="text-xs text-muted-foreground">
                {creditsData.percentage.toFixed(0)}% disponible
              </p>
            </div>
          </div>

          {/* Warning Messages */}
          {isLow && (
            <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-200 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">Crédits faibles</p>
                <p className="text-xs text-red-700">
                  Vous avez utilisé {((creditsData.limit - creditsData.remaining) / creditsData.limit * 100).toFixed(0)}% de vos crédits mensuels.
                  {showUpgradeButton && ' Envisagez de passer à une formule supérieure.'}
                </p>
              </div>
            </div>
          )}

          {isMedium && !isLow && (
            <div className="flex items-start gap-2 p-3 bg-orange-100 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900">Attention</p>
                <p className="text-xs text-orange-700">
                  Vous avez utilisé {((creditsData.limit - creditsData.remaining) / creditsData.limit * 100).toFixed(0)}% de vos crédits mensuels.
                </p>
              </div>
            </div>
          )}

          {/* Upgrade Button */}
          {showUpgradeButton && (isLow || isMedium) && (
            <Button asChild className="w-full" variant={isLow ? 'default' : 'outline'}>
              <Link href="/settings">
                {isLow ? 'Augmenter mes crédits' : 'Gérer mon abonnement'}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Database } from '@/lib/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();

    // Subscribe to real-time updates
    const supabase = createClient();
    const channel = supabase
      .channel('user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            setProfile(payload.new as UserProfile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    profile,
    loading,
    error,
    hasActiveSubscription: profile?.subscription_status === 'active',
    creditsRemaining: profile?.credits_remaining ?? 0,
    creditsUsed: profile?.credits_used_this_month ?? 0,
    creditsLimit: profile?.credits_monthly_limit ?? 0,
    planTier: profile?.plan_tier ?? 'none',
    billingCycle: profile?.billing_cycle ?? 'monthly',
  };
}

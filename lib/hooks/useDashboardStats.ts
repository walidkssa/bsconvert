"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface DashboardStats {
  totalConversions: number;
  monthConversions: number;
  successfulConversions: number;
  pendingConversions: number;
  monthlyGrowth: string;
  successRate: string;
}

export interface BankDistribution {
  bank: string;
  count: number;
  percentage: number;
}

export interface MonthlyActivity {
  month: string;
  count: number;
  percentage: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bankDistribution, setBankDistribution] = useState<BankDistribution[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

        // SECURITY FIX: Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('Unauthorized - Please log in');
        }

        // Get current date
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Total conversions - FIXED: Filter by user_id
        const { count: totalCount } = await supabase
          .from("conversions")
          .select("*", { count: "exact", head: true })
          .eq('user_id', user.id);

        // This month conversions - FIXED: Filter by user_id
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
        const { count: monthCount } = await supabase
          .from("conversions")
          .select("*", { count: "exact", head: true })
          .eq('user_id', user.id)
          .gte("created_at", firstDayOfMonth);

        // Last month conversions - FIXED: Filter by user_id
        const firstDayOfLastMonth = new Date(lastMonthYear, lastMonth, 1).toISOString();
        const firstDayOfCurrentMonth = new Date(currentYear, currentMonth, 1).toISOString();
        const { count: lastMonthCount } = await supabase
          .from("conversions")
          .select("*", { count: "exact", head: true })
          .eq('user_id', user.id)
          .gte("created_at", firstDayOfLastMonth)
          .lt("created_at", firstDayOfCurrentMonth);

        // Successful conversions - FIXED: Filter by user_id
        const { count: successCount } = await supabase
          .from("conversions")
          .select("*", { count: "exact", head: true })
          .eq('user_id', user.id)
          .eq("status", "completed");

        // Pending conversions - FIXED: Filter by user_id
        const { count: pendingCount } = await supabase
          .from("conversions")
          .select("*", { count: "exact", head: true })
          .eq('user_id', user.id)
          .in("status", ["pending", "processing"]);

        // Calculate growth percentage
        const growth =
          lastMonthCount && lastMonthCount > 0
            ? (((monthCount || 0) - lastMonthCount) / lastMonthCount) * 100
            : 0;

        // Calculate success rate
        const successRate = totalCount && totalCount > 0 ? ((successCount || 0) / totalCount) * 100 : 0;

        if (isMountedRef.current) {
          setStats({
            totalConversions: totalCount || 0,
            monthConversions: monthCount || 0,
            successfulConversions: successCount || 0,
            pendingConversions: pendingCount || 0,
            monthlyGrowth: growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`,
            successRate: `${successRate.toFixed(1)}%`,
          });
        }

        // Fetch bank distribution - FIXED: Filter by user_id
        const { data: bankData } = await supabase
          .from("conversions")
          .select("bank_name")
          .eq('user_id', user.id)
          .not("bank_name", "is", null);

        if (bankData && isMountedRef.current) {
          const bankCounts: Record<string, number> = {};
          bankData.forEach((item: any) => {
            const bank = item.bank_name || "Autres";
            bankCounts[bank] = (bankCounts[bank] || 0) + 1;
          });

          const total = bankData.length;
          const distribution = Object.entries(bankCounts)
            .map(([bank, count]) => ({
              bank,
              count,
              percentage: Math.round((count / total) * 100),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          setBankDistribution(distribution);
        }

        // Fetch monthly activity (last 5 months)
        const monthlyData: MonthlyActivity[] = [];
        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

        for (let i = 4; i >= 0; i--) {
          const targetMonth = currentMonth - i;
          const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
          const normalizedMonth = targetMonth < 0 ? 12 + targetMonth : targetMonth;

          const monthStart = new Date(targetYear, normalizedMonth, 1).toISOString();
          const monthEnd = new Date(targetYear, normalizedMonth + 1, 1).toISOString();

          const { count } = await supabase
            .from("conversions")
            .select("*", { count: "exact", head: true })
            .eq('user_id', user.id)
            .gte("created_at", monthStart)
            .lt("created_at", monthEnd);

          monthlyData.push({
            month: monthNames[normalizedMonth],
            count: count || 0,
            percentage: 0, // Will be calculated below
          });
        }

        // Calculate percentages based on max value
        const maxCount = Math.max(...monthlyData.map((m) => m.count), 1);
        monthlyData.forEach((m) => {
          m.percentage = Math.round((m.count / maxCount) * 100);
        });

        if (isMountedRef.current) {
          setMonthlyActivity(monthlyData);
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to fetch stats");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("stats-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversions",
        },
        () => {
          if (isMountedRef.current) {
            fetchStats();
          }
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return { stats, bankDistribution, monthlyActivity, loading, error };
}

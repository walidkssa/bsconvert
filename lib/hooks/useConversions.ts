"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Conversion = Database["public"]["Tables"]["conversions"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export interface ConversionWithTransactions extends Conversion {
  transactions: Transaction[];
}

export function useConversions(limit?: number) {
  const [conversions, setConversions] = useState<ConversionWithTransactions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchConversions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("conversions")
        .select(`
          *,
          transactions (*)
        `)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setConversions(data || []);
      }
    } catch (err) {
      console.error("Error fetching conversions:", err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch conversions");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [limit]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchConversions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("conversions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversions",
        },
        () => {
          if (isMountedRef.current) {
            fetchConversions();
          }
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchConversions]);

  return { conversions, loading, error };
}

export function useConversion(id: string) {
  const [conversion, setConversion] = useState<ConversionWithTransactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchConversion = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("conversions")
        .select(`
          *,
          transactions (*)
        `)
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (isMountedRef.current) {
        setConversion(data);
      }
    } catch (err) {
      console.error("Error fetching conversion:", err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch conversion");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchConversion();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchConversion]);

  return { conversion, loading, error };
}

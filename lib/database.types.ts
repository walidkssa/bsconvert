export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      conversions: {
        Row: {
          id: string
          user_id: string | null
          created_at: string
          filename: string
          file_size: number
          file_type: string
          bank_name: string | null
          account_type: string | null
          currency: string | null
          period: string | null
          period_start: string | null
          period_end: string | null
          transaction_count: number
          total_debit: number | null
          total_credit: number | null
          balance_start: number | null
          balance_end: number | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          processing_time_ms: number | null
          csv_data: string | null
          excel_data: string | null
          raw_result: Json | null
          pages_count: number
          credits_used: number
          is_free_trial: boolean
        }
        Insert: {
          id?: string
          user_id?: string | null
          created_at?: string
          filename: string
          file_size: number
          file_type: string
          bank_name?: string | null
          account_type?: string | null
          currency?: string | null
          period?: string | null
          period_start?: string | null
          period_end?: string | null
          transaction_count?: number
          total_debit?: number | null
          total_credit?: number | null
          balance_start?: number | null
          balance_end?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          processing_time_ms?: number | null
          csv_data?: string | null
          excel_data?: string | null
          raw_result?: Json | null
          pages_count?: number
          credits_used?: number
          is_free_trial?: boolean
        }
        Update: {
          id?: string
          user_id?: string | null
          created_at?: string
          filename?: string
          file_size?: number
          file_type?: string
          bank_name?: string | null
          account_type?: string | null
          currency?: string | null
          period?: string | null
          period_start?: string | null
          period_end?: string | null
          transaction_count?: number
          total_debit?: number | null
          total_credit?: number | null
          balance_start?: number | null
          balance_end?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          processing_time_ms?: number | null
          csv_data?: string | null
          excel_data?: string | null
          raw_result?: Json | null
          pages_count?: number
          credits_used?: number
          is_free_trial?: boolean
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          plan_tier: 'none' | 'starter' | 'professional' | 'enterprise'
          billing_cycle: 'monthly' | 'yearly'
          subscription_status: 'inactive' | 'active' | 'past_due' | 'canceled' | 'trialing'
          credits_monthly_limit: number
          credits_used_this_month: number
          credits_remaining: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          plan_tier?: 'none' | 'starter' | 'professional' | 'enterprise'
          billing_cycle?: 'monthly' | 'yearly'
          subscription_status?: 'inactive' | 'active' | 'past_due' | 'canceled' | 'trialing'
          credits_monthly_limit?: number
          credits_used_this_month?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          plan_tier?: 'none' | 'starter' | 'professional' | 'enterprise'
          billing_cycle?: 'monthly' | 'yearly'
          subscription_status?: 'inactive' | 'active' | 'past_due' | 'canceled' | 'trialing'
          credits_monthly_limit?: number
          credits_used_this_month?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_tier: 'starter' | 'professional' | 'enterprise'
          billing_cycle: 'monthly' | 'yearly'
          amount: number
          currency: string
          status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'unpaid'
          stripe_subscription_id: string
          stripe_customer_id: string
          stripe_price_id: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_tier: 'starter' | 'professional' | 'enterprise'
          billing_cycle: 'monthly' | 'yearly'
          amount: number
          currency?: string
          status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'unpaid'
          stripe_subscription_id: string
          stripe_customer_id: string
          stripe_price_id: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_tier?: 'starter' | 'professional' | 'enterprise'
          billing_cycle?: 'monthly' | 'yearly'
          amount?: number
          currency?: string
          status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'unpaid'
          stripe_subscription_id?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          conversion_id: string | null
          pages_processed: number
          credits_deducted: number
          file_name: string | null
          file_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversion_id?: string | null
          pages_processed: number
          credits_deducted: number
          file_name?: string | null
          file_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversion_id?: string | null
          pages_processed?: number
          credits_deducted?: number
          file_name?: string | null
          file_type?: string | null
          created_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: 'deduction' | 'monthly_reset' | 'refund' | 'bonus' | 'adjustment'
          amount: number
          description: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: 'deduction' | 'monthly_reset' | 'refund' | 'bonus' | 'adjustment'
          amount: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: 'deduction' | 'monthly_reset' | 'refund' | 'bonus' | 'adjustment'
          amount?: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
      }
      free_trial_ips: {
        Row: {
          id: string
          ip_hash: string
          conversions_count: number
          last_conversion_at: string
          created_at: string
        }
        Insert: {
          id?: string
          ip_hash: string
          conversions_count?: number
          last_conversion_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          ip_hash?: string
          conversions_count?: number
          last_conversion_at?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          conversion_id: string
          date: string
          description: string
          debit: number | null
          credit: number | null
          balance: number
          category: string | null
          is_duplicate: boolean
          has_anomaly: boolean
          anomaly_type: string | null
        }
        Insert: {
          id?: string
          conversion_id: string
          date: string
          description: string
          debit?: number | null
          credit?: number | null
          balance: number
          category?: string | null
          is_duplicate?: boolean
          has_anomaly?: boolean
          anomaly_type?: string | null
        }
        Update: {
          id?: string
          conversion_id?: string
          date?: string
          description?: string
          debit?: number | null
          credit?: number | null
          balance?: number
          category?: string | null
          is_duplicate?: boolean
          has_anomaly?: boolean
          anomaly_type?: string | null
        }
      }
      exports: {
        Row: {
          id: string
          conversion_id: string
          created_at: string
          format: 'csv' | 'excel' | 'fec' | 'sage' | 'cegid'
          config: Json | null
        }
        Insert: {
          id?: string
          conversion_id: string
          created_at?: string
          format: 'csv' | 'excel' | 'fec' | 'sage' | 'cegid'
          config?: Json | null
        }
        Update: {
          id?: string
          conversion_id?: string
          created_at?: string
          format?: 'csv' | 'excel' | 'fec' | 'sage' | 'cegid'
          config?: Json | null
        }
      }
    }
  }
}

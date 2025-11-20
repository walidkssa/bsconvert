import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';
import { getStripePriceId, getPlanLimit } from '@/lib/stripe-config';
import type { PlanTier, BillingCycle } from '@/lib/stripe-config';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parser le body
    const body = await req.json();
    const { priceId, planTier, billingCycle } = body as {
      priceId: string;
      planTier: PlanTier;
      billingCycle: BillingCycle;
    };

    if (!priceId || !planTier || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, planTier, billingCycle' },
        { status: 400 }
      );
    }

    // 3. Récupérer ou créer le Stripe customer
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    // Si le profil n'existe pas, le créer maintenant
    let profileData = profile;
    if (profileError || !profile) {
      console.error('User profile not found, creating it now:', profileError);

      // Create the profile with explicit type casting
      const { error: createError } = await (supabase as any)
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          plan_tier: 'none',
          subscription_status: 'inactive',
          credits: 0,
        });

      if (createError) {
        console.error('Failed to create user profile:', createError);
        return NextResponse.json(
          { error: 'User profile not found. Please contact support.' },
          { status: 500 }
        );
      }

      // Re-fetch the profile after creation
      const { data: newProfile, error: refetchError } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id, email')
        .eq('id', user.id)
        .single();

      if (refetchError || !newProfile) {
        console.error('Failed to fetch newly created profile:', refetchError);
        return NextResponse.json(
          { error: 'Failed to fetch user profile after creation.' },
          { status: 500 }
        );
      }

      profileData = newProfile;
    }

    let customerId = (profileData as any)?.stripe_customer_id;

    // Si pas de customer Stripe, en créer un
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || (profileData as any)?.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Sauvegarder le customer ID dans user_profiles
      await (supabase as any)
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // 4. Créer la Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/convert`, // Redirige vers la page de conversion au lieu de pricing
      allow_promotion_codes: true, // Active les codes promo Stripe
      metadata: {
        user_id: user.id,
        plan_tier: planTier,
        billing_cycle: billingCycle,
        pages_limit: getPlanLimit(planTier, billingCycle).toString(),
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_tier: planTier,
          billing_cycle: billingCycle,
        },
      },
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);

    // Return more specific error details for debugging
    const errorMessage = error instanceof Error ? error.message : `Failed to create checkout session`;
    const stripeError = error as any;

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: errorMessage,
        stripeCode: stripeError?.code,
        stripeType: stripeError?.type,
      },
      { status: 500 }
    );
  }
}

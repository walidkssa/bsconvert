import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      console.error('Signup error:', signUpError);
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      );
    }

    // Wait a bit for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify that profile was created by trigger
    const { data: profile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (profileCheckError || !profile) {
      console.error('Profile was not created by trigger:', profileCheckError);

      // Delete the auth user since profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        {
          error: 'Failed to create user profile',
          message: 'Le profil utilisateur n\'a pas pu être créé. Veuillez réessayer.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

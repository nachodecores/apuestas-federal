import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Crear cliente con service role key para admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`Probando login para: ${email}`);

    // 1. Verificar que el usuario existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado en profiles',
        details: profileError?.message
      });
    }

    // 2. Verificar que existe en auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);

    if (authError || !authUser) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado en auth.users',
        details: authError?.message
      });
    }

    // 3. Intentar login con las credenciales
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (loginError) {
      return NextResponse.json({
        success: false,
        error: 'Error en login',
        loginError: loginError.message,
        profile: {
          id: profile.id,
          email: profile.email,
          display_name: profile.display_name
        },
        authUser: {
          id: authUser.user?.id,
          email: authUser.user?.email,
          email_confirmed_at: authUser.user?.email_confirmed_at
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: loginData.user?.id,
        email: loginData.user?.email,
        display_name: profile.display_name
      }
    });

  } catch (error) {
    console.error('Error en test de login:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

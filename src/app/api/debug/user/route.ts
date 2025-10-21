import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // Usar service role key para acceso admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Verificar perfil en profiles primero
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError) {
      return NextResponse.json({ 
        error: 'Error al buscar perfil',
        details: profileError.message 
      }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ 
        error: 'Perfil no encontrado',
        email: email
      }, { status: 404 });
    }

    // Verificar usuario en auth.users usando el ID del perfil
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
    
    if (authError) {
      return NextResponse.json({ 
        error: 'Error al buscar usuario en auth.users',
        details: authError.message 
      }, { status: 500 });
    }

    if (!authUser.user) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado en auth.users',
        profileId: profile.id
      }, { status: 404 });
    }

    // Verificar apuestas del usuario
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', authUser.user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      authUser: {
        id: authUser.user.id,
        email: authUser.user.email,
        email_confirmed_at: authUser.user.email_confirmed_at,
        created_at: authUser.user.created_at,
        updated_at: authUser.user.updated_at,
        last_sign_in_at: authUser.user.last_sign_in_at
      },
      profile: profile,
      bets: bets || [],
      betsCount: bets?.length || 0
    });

  } catch (error) {
    console.error('Error en debug user API:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Usar service role key para acceso admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const email = '38904@bolichefederal.com';
    
    console.log('🔍 Diagnosticando cuenta de Ignacio de Cores...');
    
    // 1. Verificar perfil en profiles (esto nos dará info del usuario)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError) {
      console.error('❌ Error al buscar perfil:', profileError);
      return NextResponse.json({ 
        error: 'Error al buscar perfil',
        details: profileError.message 
      }, { status: 500 });
    }

    if (!profile) {
      console.log('❌ Perfil no encontrado');
      return NextResponse.json({ 
        error: 'Perfil no encontrado',
        email: email
      }, { status: 404 });
    }

    console.log('✅ Perfil encontrado:', {
      id: profile.id,
      display_name: profile.display_name,
      email: profile.email,
      league_entry_id: profile.league_entry_id,
      balance: profile.balance,
      is_claimed: profile.is_claimed
    });

    // 2. Verificar usuario en auth.users usando el ID del perfil
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
    
    if (authError) {
      console.error('❌ Error al buscar usuario en auth.users:', authError);
      return NextResponse.json({ 
        error: 'Error al buscar usuario en auth.users',
        details: authError.message 
      }, { status: 500 });
    }

    if (!authUser.user) {
      console.log('❌ Usuario no encontrado en auth.users');
      return NextResponse.json({ 
        error: 'Usuario no encontrado en auth.users',
        profileId: profile.id
      }, { status: 404 });
    }

    console.log('✅ Usuario encontrado en auth.users:', {
      id: authUser.user.id,
      email: authUser.user.email,
      email_confirmed_at: authUser.user.email_confirmed_at,
      created_at: authUser.user.created_at,
      updated_at: authUser.user.updated_at,
      last_sign_in_at: authUser.user.last_sign_in_at
    });

    // 3. Verificar si los IDs coinciden
    const idsMatch = authUser.user.id === profile.id;
    console.log('🔍 IDs coinciden:', idsMatch);
    
    if (!idsMatch) {
      console.log('❌ PROBLEMA: Los IDs no coinciden!');
      console.log('Auth user ID:', authUser.user.id);
      console.log('Profile ID:', profile.id);
    }

    // 4. Verificar apuestas del usuario
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', authUser.user.id)
      .order('created_at', { ascending: false });

    if (betsError) {
      console.error('❌ Error al buscar apuestas:', betsError);
    } else {
      console.log('✅ Apuestas encontradas:', bets?.length || 0);
    }

    return NextResponse.json({
      success: true,
      diagnosis: {
        email: email,
        idsMatch: idsMatch,
        problem: !idsMatch ? 'Los IDs de auth.users y profiles no coinciden' : 'No se detectó problema obvio'
      },
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
    console.error('❌ Error en diagnóstico de Ignacio:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

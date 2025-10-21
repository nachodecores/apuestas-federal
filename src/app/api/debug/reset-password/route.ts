import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, newPassword = '123456' } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // Usar service role key para acceso admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );


    // 1. Buscar el usuario por email en profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('❌ Error al buscar perfil:', profileError);
      return NextResponse.json({ 
        error: 'Perfil no encontrado',
        email: email
      }, { status: 404 });
    }


    // 2. Actualizar la contraseña usando admin
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      profile.id,
      {
        password: newPassword
      }
    );

    if (authError) {
      console.error('❌ Error al actualizar contraseña:', authError);
      return NextResponse.json({ 
        error: 'Error al actualizar contraseña',
        details: authError.message 
      }, { status: 500 });
    }

    if (!authData.user) {
      console.error('❌ No se recibió usuario actualizado');
      return NextResponse.json({ 
        error: 'Error: No se pudo actualizar el usuario'
      }, { status: 500 });
    }


    return NextResponse.json({
      success: true,
      message: `Contraseña actualizada exitosamente para ${profile.display_name}`,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        display_name: profile.display_name,
        newPassword: newPassword
      }
    });

  } catch (error) {
    console.error('❌ Error en reset password API:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

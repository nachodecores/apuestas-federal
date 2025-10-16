import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Crear cliente con service role key para admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Lista de emails de participantes
    const participantEmails = [
      '5865@bolichefederal.com',     // Ángel Cal
      '6753@bolichefederal.com',     // Chacho Bonino
      '5997@bolichefederal.com',     // Felipe Migues
      '38904@bolichefederal.com',    // Ignacio de Cores
      '6479@bolichefederal.com',     // Javier Villaamil
      '6494@bolichefederal.com',     // Joaquin Sarachaga
      '54556@bolichefederal.com',    // Juan Dehl
      '5769@bolichefederal.com',     // Juan Francisco Sienra
      '44346@bolichefederal.com',    // Manuel Domenech
      '5156@bolichefederal.com',     // Marcos Arocena
    ];

    const results = [];
    const errors = [];

    for (const email of participantEmails) {
      try {
        console.log(`Reseteando contraseña para: ${email}`);
        
        // Buscar el usuario por email
        const { data: users, error: searchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (searchError || !users) {
          errors.push(`${email}: Usuario no encontrado`);
          continue;
        }

        // Resetear contraseña usando admin API
        const { data, error: resetError } = await supabase.auth.admin.updateUserById(
          users.id,
          { password: '123456' }
        );

        if (resetError) {
          errors.push(`${email}: ${resetError.message}`);
        } else {
          results.push(`${email}: Contraseña reseteada exitosamente`);
        }

      } catch (error) {
        errors.push(`${email}: Error inesperado - ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Procesados ${participantEmails.length} usuarios`,
      results,
      errors
    });

  } catch (error) {
    console.error('Error en reset masivo de contraseñas:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

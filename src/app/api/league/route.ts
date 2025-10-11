// API Route: Este archivo corre en el SERVIDOR (Node.js), no en el navegador
// Por eso puede hacer requests a cualquier API sin problemas de CORS

import { NextResponse } from 'next/server';

// GET /api/league
// Esta función se ejecuta cuando alguien hace un request a /api/league
export async function GET() {
  try {
    // 1. Desde el servidor de Next.js, llamamos a la API de Draft FPL
    const response = await fetch('https://draft.premierleague.com/api/league/1651/details');
    
    // 2. Verificamos que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error('Error al obtener datos de la liga');
    }
    
    // 3. Obtenemos los datos en formato JSON
    const data = await response.json();
    
    // 4. Devolvemos los datos al cliente (navegador)
    // NextResponse.json() automáticamente agrega los headers de CORS necesarios
    return NextResponse.json(data);
    
  } catch (error) {
    // Si hay error, devolvemos un error 500
    console.error('Error en API route:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de la liga' },
      { status: 500 }
    );
  }
}


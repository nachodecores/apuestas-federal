/**
 * ENDPOINT: GET /api/league
 * 
 * PROPÓSITO:
 * Endpoint principal para obtener datos de la liga de FPL (Fantasy Premier League).
 * Actúa como proxy entre el frontend y la API externa de Draft FPL.
 * 
 * PARÁMETROS DE QUERY:
 * - upcoming (opcional): Si es 'true', devuelve solo próximos partidos + partidos terminados para rachas
 * - gameweek (opcional): Número de gameweek para obtener odds específicas
 * 
 * RESPUESTAS:
 * - 200: Datos de la liga (partidos, equipos, standings, odds)
 * - 404: No hay partidos próximos (cuando upcoming=true)
 * - 500: Error al obtener datos
 * 
 * USADO POR:
 * - LeagueContext.tsx (con upcoming=true)
 * - stats/route.ts
 * 
 * NOTA: Este endpoint corre en el SERVIDOR, por eso puede hacer requests
 * a la API de FPL sin problemas de CORS.
 */

import { NextResponse } from 'next/server';
import { getGameweekOdds } from '@/lib/odds/gameweek-odds';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameweek = searchParams.get('gameweek');
    const upcoming = searchParams.get('upcoming');
    
    // 1. Desde el servidor de Next.js, llamamos a la API de Draft FPL
    const response = await fetch('https://draft.premierleague.com/api/league/1651/details');
    
    // 2. Verificamos que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error('Error al obtener datos de la liga');
    }
    
    // 3. Obtenemos los datos en formato JSON
    const data = await response.json();
    
    // 4. OPTIMIZACIÓN: Si se solicitan solo próximos partidos
    if (upcoming === 'true') {
      
      // Filtrar solo partidos próximos
      const upcomingMatches = data.matches.filter((match: any) => !match.finished);
      
      if (upcomingMatches.length === 0) {
        return NextResponse.json({
          error: 'No hay partidos próximos'
        }, { status: 404 });
      }
      
      const nextGW = upcomingMatches[0].event;
      const nextGWMatches = upcomingMatches.filter((match: any) => match.event === nextGW);
      
      // Incluir todos los equipos para StandingsTable
      const relevantEntries = data.league_entries;
      
      // Obtener odds pre-calculadas
      let gameweekOdds = null;
      try {
        gameweekOdds = await getGameweekOdds(nextGW);
      } catch (oddsError) {
        console.warn('⚠️ Error obteniendo odds:', oddsError);
      }
      
      // NUEVO: Incluir partidos terminados de GWs anteriores para rachas
      const finishedMatches = data.matches.filter((match: any) => 
        match.finished && match.event < nextGW
      );
      
      // Devolver próximos + terminados + todos los equipos
      const optimizedData = {
        gameweek: nextGW,
        matches: [...nextGWMatches, ...finishedMatches], // Próximos + terminados para rachas
        league_entries: relevantEntries, // Todos los equipos
        standings: data.standings, // Mantener standings para compatibilidad
        gameweek_odds: gameweekOdds
      };
      
      return NextResponse.json(optimizedData);
    }
    
    // 5. Verificar si se solicitan odds para un gameweek específico
    if (gameweek) {
      try {
        // Obtener odds pre-calculadas para el gameweek
        const odds = await getGameweekOdds(parseInt(gameweek));
        
        if (odds) {
          // Agregar odds a la respuesta
          return NextResponse.json({
            ...data,
            gameweek_odds: odds
          });
        } else {
          // Si no hay odds pre-calculadas, devolver datos sin odds
          console.warn(`⚠️ No se encontraron odds pre-calculadas para GW${gameweek}`);
          return NextResponse.json({
            ...data,
            gameweek_odds: null
          });
        }
      } catch (oddsError) {
        console.error('Error obteniendo odds:', oddsError);
        // Continuar sin odds si hay error
        return NextResponse.json({
          ...data,
          gameweek_odds: null
        });
      }
    }
    
    // 6. Devolvemos los datos completos al cliente (navegador)
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

